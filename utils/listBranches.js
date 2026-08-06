const api = require('../gitlab');

/**
 * Lista las ramas de un repositorio de GitLab, para poder elegir la rama
 * de origen en el selector de la página de deploy.
 *
 * @param {number|string} projectId - Id del proyecto en GitLab.
 * @returns {Promise<string[]>} Nombres de las ramas ordenados alfabéticamente.
 */
async function listBranches(projectId) {
  const branches = await api.Branches.all(projectId, { perPage: 100 });

  return branches.map((b) => b.name).sort((a, b) => a.localeCompare(b));
}

module.exports = listBranches;
