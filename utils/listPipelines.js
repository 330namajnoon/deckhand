const api = require('../gitlab');

// gitbeaker recorre todas las páginas: para limitar usa { maxPages: 1, perPage: N }.
async function listPipelines(projectId, options = {}) {
  const pipelines = await api.Pipelines.all(projectId, options);

  return pipelines.map((p) => ({
    id: p.id,
    iid: p.iid,
    status: p.status,
    ref: p.ref,
    sha: p.sha,
    source: p.source,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    webUrl: p.web_url,
  }));
}

module.exports = listPipelines;
