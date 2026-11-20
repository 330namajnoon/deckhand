const api = require('../gitlab');
const retryTransient = require('./retryTransient');

async function createPipeline(projectId, ref, variables) {
  const options = {};
  if (variables) {
    options.variables = Object.entries(variables).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  }

  const p = await retryTransient(() => api.Pipelines.create(projectId, ref, options));

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

module.exports = createPipeline;
