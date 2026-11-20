const createPipeline = require("./createPipeline");
const findRepository = require("./findRepository");
const getJobLog = require("./getJobLog");
const parseEntornoLog = require("./parseEntornoLog");
const waitForStage = require("./waitForStage");

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
