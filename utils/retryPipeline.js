const api = require('../gitlab');
const retryTransient = require('./retryTransient');

/**
 * Vuelve a lanzar un pipeline de GitLab ya existente (equivalente al botón
 * "Retry" de la UI): reintenta los jobs fallidos/cancelados del pipeline,
 * manteniendo el mismo id de pipeline. A diferencia de createPipeline, no
 * crea un pipeline nuevo ni requiere que el deploy esté en la base de datos
 * de deckhand — solo hace falta el projectId y el pipelineId (obtenido con
 * listPipelines).
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {number} pipelineId - Id del pipeline a reintentar.
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
 * }>} Datos del pipeline reintentado.
 */
async function retryPipeline(projectId, pipelineId) {
  const p = await retryTransient(() => api.Pipelines.retry(projectId, pipelineId));

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

module.exports = retryPipeline;
