const api = require('../gitlab');

const STATUS_PRIORITY = ['failed', 'running', 'pending', 'canceled', 'manual', 'skipped', 'success'];

async function listPipelineStages(projectId, pipelineId) {
  const jobs = await api.Jobs.all(projectId, { pipelineId });

  // GitLab devuelve los jobs del más reciente al más antiguo.
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
