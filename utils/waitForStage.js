const getJobLog = require("./getJobLog");
const listPipelineStages = require("./listPipelineStages");

// Cuántos caracteres finales del log del job fallido se incluyen en el
// mensaje de error: el log completo puede ser enorme (y el error se guarda
// en una columna TEXT), pero el motivo del fallo casi siempre está al final.
const FAILED_JOB_LOG_TAIL_CHARS = 8000;

/**
 * Espera a que un stage de un pipeline termine en success, mostrando un
 * spinner con el estado y el tiempo transcurrido. Lanza un error si el
 * stage termina en failed o canceled.
 *
 * @param {number|string} projectId - Id del proyecto.
 * @param {number} pipelineId - Id del pipeline.
 * @param {string} stageName - Nombre del stage a esperar, ej. "deploy_workers".
 * @param {string} [pipelineWebUrl] - Url del pipeline (la que devuelve
 *     listPipelines), solo para incluirla en el mensaje si el stage falla.
 * @returns {Promise<{name: string, status: string, jobs: Array}>} El stage terminado en success.
 */
async function waitForStage(projectId, pipelineId, stageName, pipelineWebUrl) {
  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const startTime = Date.now();
  let frame = 0;
  let lastStatus = 'pending';

  const spinner = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    frame = (frame + 1) % spinnerFrames.length;
    process.stdout.write(
      `\r${spinnerFrames[frame]} Esperando ${stageName}... estado: ${lastStatus} (${mins}:${secs}) `
    );
  }, 100);

  // Un fallo de red/API puntual al consultar GitLab no significa que el
  // pipeline haya fallado: se tolera un número de fallos consecutivos (el
  // pipeline sigue corriendo en GitLab mientras tanto) y solo se lanza si la
  // API no responde durante muchos intentos seguidos.
  const MAX_CONSECUTIVE_ERRORS = 6;
  let consecutiveErrors = 0;

  try {
    while (true) {
      let stages;
      try {
        stages = await listPipelineStages(projectId, pipelineId);
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors += 1;
        lastStatus = `error consultando GitLab (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          throw new Error(
            `No se ha podido consultar el estado del pipeline tras ${MAX_CONSECUTIVE_ERRORS} intentos: ${error?.cause?.description ?? error.message}`
          );
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }

      const stage = stages.find(s => s.name === stageName);
      lastStatus = stage ? stage.status : 'no encontrado aún';

      if (stage && stage.status === 'success') return stage;

      if (stages.some(s => ['failed', 'canceled'].includes(s.status))) {
        const stage = stages.find(s => ['failed', 'canceled'].includes(s.status));
        const failedJob = stage.jobs.find(j => ['failed', 'canceled'].includes(j.status)) ?? stage.jobs[0];

        // El log del job fallido es lo que le permite a quien lea el error (una
        // IA vía MCP, o quien mire deploys.error) diagnosticar la causa real sin
        // tener que entrar a GitLab a mano.
        let logExcerpt = '';
        try {
          const log = await getJobLog(projectId, failedJob.id);
          logExcerpt = log?.length > FAILED_JOB_LOG_TAIL_CHARS
            ? `[...]\n${log.slice(-FAILED_JOB_LOG_TAIL_CHARS)}`
            : log;
        } catch (error) {
          logExcerpt = `(no se ha podido obtener el log del job: ${error?.cause?.description ?? error.message})`;
        }

        const pipelineRef = pipelineWebUrl ? ` — pipeline: ${pipelineWebUrl}` : '';
        throw new Error(
          `El stage ${stage.name} ha terminado con estado "${stage.status}" (job "${failedJob.name}": ${failedJob.webUrl})${pipelineRef}.\n\nLog del job:\n${logExcerpt}`
        );
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  } finally {
    clearInterval(spinner);
    process.stdout.write('\r\x1B[K'); // limpiar la línea del spinner
  }
}

module.exports = waitForStage;
