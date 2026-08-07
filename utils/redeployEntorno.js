const createPipeline = require("./createPipeline");
const findRepository = require("./findRepository");
const getJobLog = require("./getJobLog");
const parseEntornoLog = require("./parseEntornoLog");
const waitForStage = require("./waitForStage");

/**
 * Vuelve a desplegar un entorno lanzando un nuevo pipeline sobre una rama
 * existente. Es el mismo flujo que createEntorno pero, en vez de crear la
 * rama, crea un pipeline nuevo con el nombre de la rama que ya existe.
 *
 * @param {string} branchName - Nombre de la rama existente, ej. "entornostore2080storeapies".
 * @param {number|string} repoId - Id del repositorio (o su nombre, si no se
 *     conoce el id; ambiguo cuando hay varios repos con el mismo nombre).
 * @param {Object<string, string>} [variables] - Variables para el pipeline,
 *     ej. { deleteFilesBranchEntorno: "true" }.
 * @returns {Promise<{
 *   fechaCaducidad: string,
 *   usuarioSsh: string,
 *   contrasenaSsh: string,
 *   servidorSsh: string,
 *   puertoSsh: string,
 *   cadenaConexionSsh: string,
 *   rutaRaiz: string,
 *   url: string,
 *   ideKeyXdebug: string,
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
 * }>} Datos del entorno desplegado.
 */
async function redeployEntorno(branchName, repoId, variables) {
  console.log(`🔍 Buscando repositorio (id ${repoId})...`);
  const project = await findRepository(repoId);
  console.log(`✅ Repositorio encontrado: ${project.name} (id ${project.id})`);

  console.log(`🚀 Lanzando pipeline nuevo en la rama "${branchName}"...`);
  const pipeline = await createPipeline(project.id, branchName, variables);
  console.log(`✅ Pipeline #${pipeline.id} (${pipeline.webUrl ?? ''})`);

  const stage = await waitForStage(project.id, pipeline.id, 'deploy_workers', pipeline.webUrl);
  console.log(`✅ deploy_workers terminado con éxito`);

  const job = stage.jobs.find(j => j.name === 'deploy_workers');

  console.log(`📄 Descargando log del job y extrayendo datos del entorno...`);
  const jobLog = await getJobLog(project.id, job.id);

  const entorno = parseEntornoLog(jobLog);
  console.log(`🎉 Entorno listo: ${entorno.url ?? branchName}`);
  return { ...entorno, project, entornoName: branchName };
}

module.exports = redeployEntorno;
