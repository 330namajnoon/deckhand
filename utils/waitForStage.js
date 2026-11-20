const getJobLog = require("./getJobLog");
const listPipelineStages = require("./listPipelineStages");

// El motivo del fallo suele estar al final del log.
const FAILED_JOB_LOG_TAIL_CHARS = 8000;

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

  // Los fallos puntuales de la API se toleran: el pipeline sigue corriendo en GitLab.
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
    process.stdout.write('\r\x1B[K');
  }
}

module.exports = waitForStage;
