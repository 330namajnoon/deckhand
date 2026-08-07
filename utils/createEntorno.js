const api = require('../gitlab');
const createBranch = require("./createBranch");
const createBranchWithCommit = require("./createBranchWithCommit");
const duplicateTestEnvFolder = require("./duplicateTestEnvFolder");
const enableMessenger = require("./enableMessenger");
const findRepository = require("./findRepository");
const getJobLog = require("./getJobLog");
const listPipelines = require("./listPipelines");
const parseEntornoLog = require("./parseEntornoLog");
const { SYNC_ENV_PROJECTS, FRONTEND_TEST_PROJECTS, MESSENGER_PROJECTS } = require("./repoRoles");
const retryTransient = require("./retryTransient");
const syncEntornoEnv = require("./syncEntornoEnv");
const waitForStage = require("./waitForStage");

/**
 * Crea un entorno para una tarea a partir del nombre de la tarea, el
 * repositorio y una referencia (rama).
 *
 * El nombre del entorno se construye según la regla:
 * tipo + tarea en minúsculas sin separadores + repositorio en minúsculas
 * sin separadores. Ej: ("STORE-2080", "store-api-es", "dev", "entorno")
 * → "entornostore2080storeapies"; con tipo "test" → "teststore2080storeapies".
 *
 * @param {string} taskName - Nombre de la tarea, ej. "STORE-2080".
 * @param {number|string} repoId - Id del repositorio (o su nombre, si no se
 *     conoce el id; ambiguo cuando hay varios repos con el mismo nombre).
 * @param {string} ref - Rama o referencia de origen, ej. "dev".
 * @param {'entorno'|'test'} [type] - Tipo de entorno; decide el prefijo del nombre.
 * @param {string} [entornoUrl] - Url de otro entorno con el que sincronizar.
 *     En los proyectos de SYNC_ENV_PROJECTS la rama se crea con un commit que
 *     apunta API_MONO_URL y STORE_API_URL de envs/.env.entorno a esta url. En
 *     los de FRONTEND_TEST_PROJECTS con tipo "test" decide a qué url apunta el
 *     window.env_target del envs/<rama>/environment.js duplicado desde la
 *     plantilla. En el resto de proyectos se ignora.
 * @param {boolean} [messenger] - Si es true y el proyecto está en
 *     MESSENGER_PROJECTS, la rama se crea con un commit que habilita el
 *     messenger (supervisor/entorno/messenger-consume.conf y sufijo _s en los
 *     transports ent_* de config/packages/messenger.yaml). En el resto de
 *     proyectos se ignora.
 * @param {Array<{action: string, filePath: string, content: string}>} [editActions] -
 *     Acciones de commit adicionales con los cambios hechos a mano en el
 *     editor de código de la página de deploy. Se aplican en el mismo commit
 *     inicial de la rama.
 * @returns {Promise<{
 *   fechaCaducidad: string,
*   usuarioSsh: string,
*   contrasenaSsh: string,
*   servidorSsh: string,
*   puertoSsh: string,
*   cadenaConexionSsh: string,
*   rutaRaiz: string,
*   url: string,
*   ideKeyXdebug: string
*   entornoName: string,
*   project: {
*     id: number,
*     name: string,
*     pathWithNamespace: string,
*     defaultBranch: string,
*     webUrl: string,
*     sshUrl: string,
*     httpUrl: string
*   }
* }>} Nombre del entorno generado.
 */
async function createEntorno(taskName, repoId, ref, type = 'entorno', entornoUrl, messenger = false, editActions = []) {
  const normalize = (value) => value.toLowerCase().replace(/[-_]/g, '');

  console.log(`🔍 Buscando repositorio (id ${repoId})...`);
  const project = await findRepository(repoId);
  console.log(`✅ Repositorio encontrado: ${project.name} (id ${project.id})`);

  const entornoName = `${type}${normalize(taskName)}${normalize(project.name)}`;
  console.log(`🏷️  Nombre del entorno: ${entornoName}`);

  // Cambios que se aplican en el primer commit de la rama, según el proyecto
  // y las opciones elegidas. Todos van en un único commit.
  const actions = [];
  const changes = [];

  if (entornoUrl && SYNC_ENV_PROJECTS.includes(project.name)) {
    console.log(`🔗 Sincronizando envs/.env.entorno con ${entornoUrl}...`);
    actions.push(await syncEntornoEnv(project.id, ref, entornoUrl));
    changes.push(`sincronizar envs/.env.entorno con ${entornoUrl.replace(/\/+$/, '')}`);
  }

  if (FRONTEND_TEST_PROJECTS.includes(project.name)) {
    console.log(`📁 Duplicando envs/template-branches-test en envs/${entornoName}...`);
    actions.push(...await duplicateTestEnvFolder(project.id, ref, entornoName, entornoUrl));
    changes.push(entornoUrl
      ? `crear envs/${entornoName} apuntando env_target a ${entornoUrl.replace(/\/+$/, '')}`
      : `crear envs/${entornoName} desde la plantilla`);
  }

  if (messenger && MESSENGER_PROJECTS.includes(project.name)) {
    console.log(`📨 Habilitando el messenger...`);
    actions.push(...await enableMessenger(project.id, ref));
    changes.push('habilitar el messenger');
  }

  if (editActions.length > 0) {
    console.log(`✏️  Aplicando ${editActions.length} fichero(s) editado(s) a mano...`);
    actions.push(...editActions);
    changes.push(`editar ${editActions.map((a) => a.filePath).join(', ')}`);
  }

  let newBranch;
  if (actions.length > 0) {
    console.log(`🌱 Creando rama "${entornoName}" desde "${ref}" con ${actions.length} fichero(s) modificado(s)...`);
    newBranch = await createBranchWithCommit(project.id, entornoName, ref, `Entorno ${entornoName}: ${changes.join(', ')}`, actions);
    console.log(`✅ Rama creada con los cambios aplicados`);
  } else {
    try {
      console.log(`🌱 Creando rama "${entornoName}" desde "${ref}"...`);
      newBranch = await createBranch(project.id, entornoName, ref);
      console.log(`✅ Rama creada`);
    } catch (error) {
      // Si la rama ya existía la reutilizamos (p. ej. reintento de la misma
      // tarea); cualquier otro error (permisos, red, etc.) es real y no debe
      // tragarse, porque si seguimos sin rama nunca aparecerá el pipeline y el
      // deploy fallaría 2 minutos después con un error que no dice la causa.
      if (error?.cause?.description !== "Branch already exists") {
        throw error;
      }
      console.log(`ℹ️  La rama ya existía, se reutiliza`);

      // Sin newBranch.sha no se puede identificar el pipeline correcto más
      // abajo (ver comentario junto a la búsqueda del pipeline), así que hay
      // que consultar el sha actual de la rama reutilizada.
      const branch = await retryTransient(() => api.Branches.show(project.id, entornoName));
      newBranch = { name: entornoName, ref, sha: branch.commit.id };
    }
  }

  // GitLab tarda unos segundos en crear el pipeline tras crear la rama, así
  // que reintentamos hasta que aparezca. Un fallo de red/API puntual al listar
  // pipelines no debe tirar el deploy abajo (el pipeline puede seguir
  // creándose perfectamente en GitLab): se tolera y se reintenta dentro del
  // mismo plazo, solo se lanza si el plazo se agota.
  //
  // El nombre de rama del entorno es determinista (se reutiliza en cada
  // redeploy/reintento de la misma tarea+repo), así que puede haber pipelines
  // antiguos en esa misma rama. Filtrar solo por ref no basta: si este sondeo
  // llega antes de que GitLab cree el pipeline nuevo, `find` se queda con uno
  // viejo (ya terminado, quizá failed) y waitForStage falla al momento con un
  // error que no tiene nada que ver con este deploy. Comparar además el sha
  // con el del commit recién creado (newBranch.sha) evita confundirlos.
  console.log(`🚀 Buscando pipeline de la rama...`);
  let pipline;
  const pipelineDeadline = Date.now() + 120000;
  while (true) {
    try {
      const piplines = await listPipelines(project.id, { ref: entornoName });
      pipline = piplines.find(p => p.ref === entornoName && p.sha === newBranch.sha);
      if (pipline) break;
    } catch (error) {
      console.warn(`⚠️  Error listando pipelines, se reintenta: ${error?.cause?.description ?? error.message}`);
    }
    if (Date.now() > pipelineDeadline) {
      throw new Error(`No ha aparecido ningún pipeline para la rama "${entornoName}" tras 2 minutos`);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  console.log(`✅ Pipeline #${pipline.id} (${pipline.webUrl ?? ''})`);

  const stage = await waitForStage(project.id, pipline.id, 'deploy_workers', pipline.webUrl);
  console.log(`✅ deploy_workers terminado con éxito`);

  const job = stage.jobs.find(j => j.name === 'deploy_workers');

  console.log(`📄 Descargando log del job y extrayendo datos del entorno...`);
  const jobLog = await getJobLog(project.id, job.id);

  const entorno = parseEntornoLog(jobLog);
  console.log(`🎉 Entorno listo: ${entorno.url ?? entornoName}`);
  return { ...entorno, project, entornoName };
}

module.exports = createEntorno;
