const api = require('../gitlab');

/**
 * Lista los ficheros y carpetas de una ruta de un repositorio de GitLab,
 * para poder navegar el árbol en el editor de código de la página de deploy.
 *
 * @param {number|string} projectId - Id del proyecto en GitLab.
 * @param {string} ref - Rama o commit del que listar el árbol.
 * @param {string} [path] - Ruta dentro del repo; vacía para la raíz.
 * @param {boolean} [recursive] - Si es true, devuelve también el contenido de
 *     las subcarpetas (para operaciones sobre carpetas enteras, como
 *     duplicar o renombrar, que necesitan la lista completa de ficheros).
 * @returns {Promise<Array<{ name: string, path: string, type: 'tree'|'blob' }>>}
 *     Entradas de la ruta, carpetas primero y ordenadas alfabéticamente.
 */
async function listRepositoryTree(projectId, ref, path = '', recursive = false) {
  const entries = await api.Repositories.allRepositoryTrees(projectId, { ref, path, recursive, perPage: 100 });

  return entries
    .map((e) => ({ name: e.name, path: e.path, type: e.type }))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'tree' ? -1 : 1));
}

module.exports = listRepositoryTree;
