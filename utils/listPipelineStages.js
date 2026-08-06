const api = require('../gitlab');

// Prioridad para derivar el estado de un stage a partir de sus jobs
const STATUS_PRIORITY = ['failed', 'running', 'pending', 'canceled', 'manual', 'skipped', 'success'];

/**
 * Devuelve los stages de un pipeline con sus jobs. GitLab no expone los stages
 * como recurso propio: se obtienen agrupando los jobs del pipeline, en el orden
 * en que se ejecutan.
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {number} pipelineId - Id del pipeline (el `id` que devuelve listPipelines).
 * @returns {Promise<Array<{
 *   name: string,
 *   status: string,
 *   jobs: Array<{ id: number, name: string, status: string, webUrl: string }>
 * }>>} Stages en orden de ejecución. El estado del stage se deriva de sus jobs
 *     (si alguno falló → 'failed', si alguno corre → 'running', etc.). El `id`
 *     de cada job sirve para api.Jobs.retry(projectId, id), api.Jobs.cancel(...),
 *     api.Jobs.showLog(...), etc.
 */
async function listPipelineStages(projectId, pipelineId) {
  const jobs = await api.Jobs.all(projectId, { pipelineId });

  // Los jobs llegan del más reciente al más antiguo; invertir para respetar el orden de ejecución
  const stages = new Map();
  for (const job of jobs.reverse()) {
    if (!stages.has(job.stage)) {
      stages.set(job.stage, []);
    }
    stages.get(job.stage).push({
      id: job.id,
      name: job.name,
      status: job.status,
      webUrl: job.web_url,
    });
  }

  return [...stages.entries()].map(([name, stageJobs]) => ({
    name,
    status:
      STATUS_PRIORITY.find((s) => stageJobs.some((j) => j.status === s)) ||
      stageJobs[0].status,
    jobs: stageJobs,
  }));
}

module.exports = listPipelineStages;
