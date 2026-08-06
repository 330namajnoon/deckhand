const api = require('../gitlab');

/**
 * Crea una rama nueva cuyo primer commit aplica las acciones indicadas
 * (ficheros a crear/modificar/borrar). Rama y commit se crean en una sola
 * operación (startBranch), de forma que solo se dispara un pipeline. Si la
 * rama ya existía, el commit se hace directamente sobre ella.
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {string} branchName - Nombre de la rama a crear.
 * @param {string} ref - Rama o commit desde el que crearla.
 * @param {string} message - Mensaje del commit.
 * @param {Array<{action: string, filePath: string, content: string}>} actions -
 *     Acciones del commit, en el formato de la API de commits de GitLab.
 * @returns {Promise<{ name: string, ref: string, sha: string }>} Datos de la
 *     rama: nombre, ref de origen y sha del commit creado.
 */
async function createBranchWithCommit(projectId, branchName, ref, message, actions) {
  let commit;
  try {
    commit = await api.Commits.create(projectId, branchName, message, actions, { startBranch: ref });
  } catch (error) {
    // Si la rama ya existía, se hace el commit directamente sobre ella. En ese
    // caso los ficheros a crear pueden existir ya en la rama (p. ej. de un
    // deploy anterior de la misma tarea): esas acciones pasan a "update".
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
