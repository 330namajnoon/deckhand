const { execFile } = require("child_process");
const dns = require("dns/promises");
const { promisify } = require("util");
const runExpect = require("./runExpect");

const execFileAsync = promisify(execFile);

/**
 * Hace una conexión SSH por consola al entorno y resuelve el cambio de
 * contraseña forzado si el servidor lo pide (contraseña actual =
 * contrasenaSsh, nueva contraseña = ENTORNO_NEW_PASSWORD). Si no pide nada, entra
 * y sale sin más. Antes de conectar limpia de known_hosts la clave de
 * host de un despliegue anterior del mismo servidor:puerto.
 *
 * @param {{
 *   contrasenaSsh: string,
 *   servidorSsh: string,
 *   puertoSsh: string,
 *   cadenaConexionSsh: string
 * }} entorno - Objeto devuelto por createEntorno (o el deploy guardado).
 * @returns {Promise<{ success: true }>}
 */
async function loginEntorno(entorno) {
  const { contrasenaSsh, servidorSsh, puertoSsh, cadenaConexionSsh } = entorno;
  const nuevaContrasena = process.env.ENTORNO_NEW_PASSWORD;
  if (!nuevaContrasena) {
    throw new Error("Falta la variable de entorno ENTORNO_NEW_PASSWORD (ver ecosystem.config.js)");
  }

  // Al redesplegar, el entorno se recrea con una clave de host nueva y ssh
  // abortaría con "REMOTE HOST IDENTIFICATION HAS CHANGED". known_hosts
  // guarda una entrada por hostname y otra por IP (CheckHostIP), así que
  // hay que borrar las dos. Se ignoran los errores (p. ej. si no había
  // ninguna entrada).
  const hosts = [servidorSsh];
  try {
    const { address } = await dns.lookup(servidorSsh);
    if (address && address !== servidorSsh) hosts.push(address);
  } catch {
    // si no se puede resolver, se limpia solo la entrada del hostname
  }
  for (const host of hosts) {
    await execFileAsync("ssh-keygen", ["-R", `[${host}]:${puertoSsh}`]).catch(() => {});
  }

  await runExpect(`
    set timeout 60
    spawn ${cadenaConexionSsh}
    expect {
      -re "(yes/no|fingerprint)" { send "yes\\r"; exp_continue }
      -re "(?i)Current" { send "${contrasenaSsh}\\r"; exp_continue }
      -re "(?i)New password" { send "${nuevaContrasena}\\r"; exp_continue }
      -re "(?i)Retype new password" { send "${nuevaContrasena}\\r"; exp_continue }
      -re "(\\\\$|#) $" { send "exit\\r" }
    }
    expect eof
  `);

  return { success: true };
}

module.exports = loginEntorno;
