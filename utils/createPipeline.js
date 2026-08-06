const api = require('../gitlab');
const retryTransient = require('./retryTransient');

/**
 * Lanza un nuevo pipeline en un proyecto de GitLab sobre una ref existente.
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {string} ref - Rama (o tag) existente sobre la que lanzar el pipeline.
 * @param {Object<string, string>} [variables] - Variables para el pipeline,
 *     ej. { deleteFilesBranchEntorno: "true" }. Los valores deben ser strings.
 * @returns {Promise<{
 *   id: number,
 *   iid: number,
 *   status: string,
 *   ref: string,
 *   sha: string,
 *   source: string,
 *   createdAt: string,
 *   updatedAt: string,
 *   webUrl: string
 * }>} Datos del pipeline creado.
 */
async function createPipeline(projectId, ref, variables) {
  const options = {};
  if (variables) {
    options.variables = Object.entries(variables).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  }

  const p = await retryTransient(() => api.Pipelines.create(projectId, ref, options));

  return {
    id: p.id,
    iid: p.iid,
    status: p.status,
    ref: p.ref,
    sha: p.sha,
    source: p.source,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    webUrl: p.web_url,
  };
}

module.exports = createPipeline;
