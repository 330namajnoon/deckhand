const { spawn } = require("child_process");

/**
 * Ejecuta un script de expect y devuelve una promesa que se resuelve
 * cuando el proceso termina con código 0.
 *
 * @param {string} script - Script de expect a ejecutar con `expect -c`.
 * @returns {Promise<void>}
 */
function runExpect(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("expect", ["-c", script], { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`expect ha terminado con código ${code}`));
    });
  });
}

module.exports = runExpect;
