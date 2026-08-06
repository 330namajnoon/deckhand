const api = require('../gitlab');
const retryTransient = require('./retryTransient');

/**
 * Crea una nueva rama en un proyecto de GitLab.
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {string} branchName - Nombre de la rama a crear.
 * @param {string} [ref] - Rama o commit desde el que crearla. Si no se indica,
 *     se usa la rama por defecto del proyecto.
 * @returns {Promise<{
 *   name: string,
 *   ref: string,
 *   sha: string,
 *   webUrl: string
 * }>} Datos de la rama creada: nombre, ref de origen, sha del commit en el que
 *     apunta y url web.
 */
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
