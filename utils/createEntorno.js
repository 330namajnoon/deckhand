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

// Nombre del entorno: tipo + tarea + repo, en minúsculas y sin separadores.
async function createEntorno(taskName, repoId, ref, type = 'entorno', entornoUrl, messenger = false, editActions = []) {
  const normalize = (value) => value.toLowerCase().replace(/[-_]/g, '');

  console.log(`🔍 Buscando repositorio (id ${repoId})...`);
  const project = await findRepository(repoId);
  console.log(`✅ Repositorio encontrado: ${project.name} (id ${project.id})`);

  const entornoName = `${type}${normalize(taskName)}${normalize(project.name)}`;
  console.log(`🏷️  Nombre del entorno: ${entornoName}`);

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
      // Si la rama ya existía se reutiliza; cualquier otro error se propaga.
      if (error?.cause?.description !== "Branch already exists") {
        throw error;
      }
      console.log(`ℹ️  La rama ya existía, se reutiliza`);

      // Sin newBranch.sha no se distingue el pipeline nuevo de los antiguos de la rama.
      const branch = await retryTransient(() => api.Branches.show(project.id, entornoName));
      newBranch = { name: entornoName, ref, sha: branch.commit.id };
    }
  }

  // La rama se reutiliza entre redeploys: se filtra también por sha para no coger un pipeline antiguo.
  // GitLab tarda unos segundos en crear el pipeline; los fallos puntuales de la API se reintentan.
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
