const { spawn } = require("child_process");

function runExpect(script, { env } = {}) {
  return new Promise((resolve, reject) => {
    // Sin heredar stdio: en el MCP por stdio, stdin/stdout son el canal del protocolo.
    const child = spawn("expect", ["-c", script], {
      stdio: ["ignore", "pipe", "pipe"],
      env: env ? { ...process.env, ...env } : process.env,
    });
    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error("Falta el binario `expect` en la máquina donde corre deckhand (instálalo con el gestor de paquetes del sistema)", { cause: error }));
        return;
      }
      reject(error);
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      const error = new Error(`expect ha terminado con código ${code}`);
      error.exitCode = code;
      reject(error);
    });
  });
}

module.exports = runExpect;
