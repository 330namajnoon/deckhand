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

/**
 * Busca un repositorio en GitLab por id o, si no es un id, por nombre, y
 * devuelve los datos necesarios para operar sobre él (crear/borrar ramas, etc.).
 *
 * Buscar por nombre es ambiguo cuando hay varios repositorios con el mismo
 * nombre en distintos namespaces: en ese caso hay que buscar por id.
 *
 * @param {number|string} repo - Id del repositorio, o su nombre si no se conoce el id.
 * @returns {Promise<{
 *   id: number,
 *   name: string,
 *   pathWithNamespace: string,
 *   defaultBranch: string,
 *   webUrl: string,
 *   sshUrl: string,
 *   httpUrl: string
 * }>} Datos del proyecto. El `id` es lo que piden las demás llamadas de la API
 *     (api.Branches.create(id, ...), api.Branches.remove(id, ...), etc.).
 * @throws {Error} Si no se encuentra ningún repositorio con ese id o nombre.
 */
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

  // Preferir la coincidencia exacta por path o nombre; si no, el primer resultado
  const project =
    results.find((p) => p.path === repo || p.name === repo) || results[0];

  return toProject(project);
}

module.exports = findRepository;
