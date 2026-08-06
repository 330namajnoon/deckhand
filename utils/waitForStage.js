const listPipelineStages = require("./listPipelineStages");

/**
 * Espera a que un stage de un pipeline termine en success, mostrando un
 * spinner con el estado y el tiempo transcurrido. Lanza un error si el
 * stage termina en failed o canceled.
 *
 * @param {number|string} projectId - Id del proyecto.
 * @param {number} pipelineId - Id del pipeline.
 * @param {string} stageName - Nombre del stage a esperar, ej. "deploy_workers".
 * @returns {Promise<{name: string, status: string, jobs: Array}>} El stage terminado en success.
 */
async function waitForStage(projectId, pipelineId, stageName) {
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
        throw new Error(`El stage ${stage.name} ha terminado con estado "${stage.status}"`);
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  } finally {
    clearInterval(spinner);
    process.stdout.write('\r\x1B[K'); // limpiar la línea del spinner
  }
}

module.exports = waitForStage;
