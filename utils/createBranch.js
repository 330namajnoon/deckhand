const api = require('../gitlab');
const retryTransient = require('./retryTransient');

async function createBranch(projectId, branchName, ref) {
  let sourceRef = ref;
  if (!sourceRef) {
    const project = await retryTransient(() => api.Projects.show(projectId));
    sourceRef = project.default_branch;
  }

  const branch = await retryTransient(() => api.Branches.create(projectId, branchName, sourceRef));

  return {
    name: branch.name,
    ref: sourceRef,
    sha: branch.commit.id,
    webUrl: branch.web_url,
  };
}

module.exports = createBranch;
