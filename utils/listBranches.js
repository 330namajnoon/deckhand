const api = require('../gitlab');

async function listBranches(projectId) {
  const branches = await api.Branches.all(projectId, { perPage: 100 });

  return branches.map((b) => b.name).sort((a, b) => a.localeCompare(b));
}

module.exports = listBranches;
