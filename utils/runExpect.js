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
    child.on("error", (error) => {
      // ENOENT aquí es "no existe el binario expect", no un fallo del script:
      // el mensaje crudo de Node no lo deja claro y obliga a adivinar.
      if (error.code === "ENOENT") {
        reject(new Error("Falta el binario `expect` en el servidor de deckhand (instálalo con el gestor de paquetes del sistema)", { cause: error }));
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`expect ha terminado con código ${code}`));
    });
  });
}

module.exports = runExpect;
