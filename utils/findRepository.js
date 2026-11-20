const api = require('../gitlab');
const retryTransient = require('./retryTransient');

const toProject = (project) => ({
  id: project.id,
  name: project.name,
  pathWithNamespace: project.path_with_namespace,
  defaultBranch: project.default_branch,
  webUrl: project.web_url,
  sshUrl: project.ssh_url_to_repo,
  httpUrl: project.http_url_to_repo,
});

async function findRepository(repo) {
  const isId = typeof repo === 'number' || /^\d+$/.test(repo);

  if (isId) {
    const project = await retryTransient(() => api.Projects.show(repo));
    return toProject(project);
  }

  const results = await retryTransient(() => api.Projects.search(repo));

  if (!results || results.length === 0) {
    throw new Error(`No se encontró ningún repositorio con el nombre "${repo}"`);
  }

  const project =
    results.find((p) => p.path === repo || p.name === repo) || results[0];

  return toProject(project);
}

module.exports = findRepository;
