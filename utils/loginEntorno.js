const { execFile } = require("child_process");
const dns = require("dns/promises");
const { promisify } = require("util");
const changeEntornoPassword = require("./changeEntornoPassword");
const getEntornoPassword = require("./getEntornoPassword");
const checkEntornoLogin = require("./checkEntornoLogin");

const execFileAsync = promisify(execFile);

// Cada redeploy cambia la clave de host: se borran las entradas de known_hosts por hostname e IP.
const clearKnownHosts = async (host, port) => {
  const hosts = [host];
  try {
    const { address } = await dns.lookup(host);
    if (address && address !== host) hosts.push(address);
  } catch {
  }
  for (const h of hosts) {
    await execFileAsync("ssh-keygen", ["-R", `[${h}]:${port}`]).catch(() => {});
  }
};

async function loginEntorno(entorno) {
  const { contrasenaSsh, servidorSsh, puertoSsh } = entorno;
  const { key, password } = getEntornoPassword(entorno);

  await clearKnownHosts(servidorSsh, puertoSsh);

  // Si ya entra con la contraseña nueva, el cambio está hecho.
  if ((await checkEntornoLogin(entorno, password)).ok) return { success: true };

  try {
    await changeEntornoPassword(entorno, contrasenaSsh ?? "", password);
  } catch (error) {
    if (error.code === "BAD_PASSWORD") {
      throw new Error(`El entorno rechaza la contraseña de ${key} por su política de contraseñas: cámbiala en /deckhand:settings`);
    }
    throw error;
  }

  const check = await checkEntornoLogin(entorno, password);
  if (!check.ok) {
    throw new Error(`El cambio de contraseña no se ha completado (respuesta del servidor: ${check.reason})`);
  }

  return { success: true };
}

module.exports = loginEntorno;
