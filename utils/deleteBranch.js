const api = require('../gitlab');

/**
 * Borra una rama de un proyecto de GitLab.
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {string} branchName - Nombre de la rama a borrar.
 * @returns {Promise<{ name: string, deleted: boolean }>} Nombre de la rama
 *     borrada y confirmación.
 * @throws {Error} Si la rama no existe o no se puede borrar (p. ej. está
 *     protegida).
 */
async function deleteBranch(projectId, branchName) {
  await api.Branches.remove(projectId, branchName);

  return {
    name: branchName,
    deleted: true,
  };
}

module.exports = deleteBranch;
