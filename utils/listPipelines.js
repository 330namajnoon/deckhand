const api = require('../gitlab');

/**
 * Devuelve el listado de pipelines de un proyecto de GitLab.
 *
 * @param {number|string} projectId - Id del proyecto (el `id` que devuelve findRepository)
 *     o su path completo (p. ej. "grupo/subgrupo/mi-repo").
 * @param {object} [options] - Filtros opcionales que acepta la API de GitLab:
 *     `ref` (rama), `status` ('success' | 'failed' | 'running' | 'pending' | ...), etc.
 *     Ojo: gitbeaker recorre todas las páginas por defecto; para limitar el número
 *     de resultados usa `{ maxPages: 1, perPage: N }` (perPage solo no limita).
 * @returns {Promise<Array<{
 *   id: number,
 *   iid: number,
 *   status: string,
 *   ref: string,
 *   sha: string,
 *   source: string,
 *   createdAt: string,
 *   updatedAt: string,
 *   webUrl: string
 * }>>} Pipelines ordenados del más reciente al más antiguo. El `id` es lo que
 *     piden las demás llamadas (api.Pipelines.show(projectId, id),
 *     api.Pipelines.retry(projectId, id), api.Pipelines.cancel(projectId, id), etc.).
 */
async function listPipelines(projectId, options = {}) {
  const pipelines = await api.Pipelines.all(projectId, options);

  return pipelines.map((p) => ({
    id: p.id,
    iid: p.iid,
    status: p.status,
    ref: p.ref,
    sha: p.sha,
    source: p.source,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    webUrl: p.web_url,
  }));
}

module.exports = listPipelines;
