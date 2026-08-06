const { spawn } = require("child_process");

/**
 * Abre VS Code conectado por Remote-SSH al servidor indicado.
 *
 * Acepta una cadena de conexión tipo "ssh root@servidor.ejemplo.local -p 30510"
 * y la traduce a una URI vscode-remote (ssh-remote+usuario@servidor:puerto).
 *
 * @param {string} cadenaConexionSsh - Comando ssh completo (p. ej. "ssh root@host -p 30510").
 * @param {string} [carpeta="/root"] - Carpeta remota que se abrirá en VS Code.
 * @returns {Promise<{ success: true, uri: string }>}
 */
function openRemoteVscode(user, hostName, port, route = "/var/www/") {
  const host = `${hostName}:${port}`;
  const uri = `vscode-remote://ssh-remote+${user}@${host}${route}`;
  console.log(`Abriendo VS Code en ${uri}...`);

  return new Promise((resolve, reject) => {
    const child = spawn("code", ["--folder-uri", uri], { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ success: true, uri });
      else reject(new Error(`code ha terminado con código ${code}`));
    });
  });
}

module.exports = openRemoteVscode;
