const api = require('../gitlab');
const retryTransient = require('./retryTransient');

async function retryPipeline(projectId, pipelineId) {
  const p = await retryTransient(() => api.Pipelines.retry(projectId, pipelineId));

  return {
    id: p.id,
    iid: p.iid,
    status: p.status,
    ref: p.ref,
    sha: p.sha,
    source: p.source,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    webUrl: p.web_url,
  };
}

module.exports = retryPipeline;
