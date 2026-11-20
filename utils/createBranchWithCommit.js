const api = require('../gitlab');

// Rama y commit en una sola operación (startBranch): solo se dispara un pipeline.
async function createBranchWithCommit(projectId, branchName, ref, message, actions) {
  let commit;
  try {
    commit = await api.Commits.create(projectId, branchName, message, actions, { startBranch: ref });
  } catch (error) {
    // Si la rama ya existía, los "create" de ficheros que ya están pasan a "update".
    if (!/already exists/i.test(error?.cause?.description ?? error.message ?? '')) throw error;

    const adjusted = await Promise.all(
      actions.map(async (action) => {
        if (action.action !== 'create') return action;
        try {
          await api.RepositoryFiles.show(projectId, action.filePath, branchName);
          return { ...action, action: 'update' };
        } catch {
          return action;
        }
      })
    );

    commit = await api.Commits.create(projectId, branchName, message, adjusted);
  }

  return { name: branchName, ref, sha: commit.id };
}

module.exports = createBranchWithCommit;
