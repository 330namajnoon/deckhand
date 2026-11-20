const api = require('../gitlab');

// Sin Advanced Search, GitLab solo busca en la rama por defecto.
async function searchRepository(projectId, search) {
  const results = await api.Search.all('blobs', search, { projectId });

  return results.map((r) => ({
    path: r.path,
    ref: r.ref,
    startLine: r.startline,
    data: r.data,
  }));
}

module.exports = searchRepository;
