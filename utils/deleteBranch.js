const api = require('../gitlab');

async function deleteBranch(projectId, branchName) {
  await api.Branches.remove(projectId, branchName);

  return {
    name: branchName,
    deleted: true,
  };
}

module.exports = deleteBranch;
