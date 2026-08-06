const api = require('../gitlab');

/**
 * Devuelve el log (trace) de un job de GitLab.
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {number} jobId - Id del job (el `id` de cada job que devuelve listPipelineStages).
 * @returns {Promise<string>} El log completo del job como texto plano.
 *     Puede venir vacío si el job aún no ha empezado o no generó salida.
 */
async function getJobLog(projectId, jobId) {
  return api.Jobs.showLog(projectId, jobId);
}

module.exports = getJobLog;
