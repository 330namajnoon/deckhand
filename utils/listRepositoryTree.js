const api = require('../gitlab');

async function listRepositoryTree(projectId, ref, path = '', recursive = false) {
  const entries = await api.Repositories.allRepositoryTrees(projectId, { ref, path, recursive, perPage: 100 });

  return entries
    .map((e) => ({ name: e.name, path: e.path, type: e.type }))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'tree' ? -1 : 1));
}

module.exports = listRepositoryTree;
