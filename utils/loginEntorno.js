const { execFile } = require("child_process");
const dns = require("dns/promises");
const { promisify } = require("util");
const runExpect = require("./runExpect");
const getEntornoPassword = require("./getEntornoPassword");
const checkEntornoLogin = require("./checkEntornoLogin");

const execFileAsync = promisify(execFile);

const EXIT_STUCK = 4;
const EXIT_BAD_PASSWORD = 6;

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

// Sin "(?i)": el pre-filtro glob de expect distingue mayúsculas.
// "Retype new" va antes que "New" porque expect usa el primer patrón que case.
const LOGIN_SCRIPT = `
  set timeout 60
  spawn ssh $env(DECKHAND_SSH_TARGET) -p $env(DECKHAND_SSH_PORT)
  expect {
    -re "(yes/no|fingerprint)" { send "yes\\r"; exp_continue }
    -re "(Current|current).*password:" { send -- "$env(DECKHAND_OLD_PASSWORD)\\r"; exp_continue }
    "BAD PASSWORD" { puts "\\nERROR: el servidor rechaza la contraseña nueva (pam_pwquality)"; exit ${EXIT_BAD_PASSWORD} }
    -re "(Retype|retype) new password:" { send -- "$env(DECKHAND_NEW_PASSWORD)\\r"; exp_continue }
    -re "(New|new) password:" { send -- "$env(DECKHAND_NEW_PASSWORD)\\r"; exp_continue }
    "'s password:" { send -- "$env(DECKHAND_OLD_PASSWORD)\\r"; exp_continue }
    -re "(\\\\$|#) $" { send "exit\\r"; exp_continue }
    timeout { puts "\\nERROR: atascado en el cambio de contraseña"; exit ${EXIT_STUCK} }
    eof { exit 0 }
  }
`;

async function loginEntorno(entorno) {
  const { usuarioSsh, contrasenaSsh, servidorSsh, puertoSsh } = entorno;
  const { key, password } = getEntornoPassword(entorno);

  await clearKnownHosts(servidorSsh, puertoSsh);

  // Si ya entra con la contraseña nueva, el cambio está hecho.
  if ((await checkEntornoLogin(entorno, password)).ok) return { success: true };

  try {
    await runExpect(LOGIN_SCRIPT, {
      env: {
        DECKHAND_SSH_TARGET: `${usuarioSsh || "root"}@${servidorSsh}`,
        DECKHAND_SSH_PORT: String(puertoSsh),
        DECKHAND_OLD_PASSWORD: contrasenaSsh ?? "",
        DECKHAND_NEW_PASSWORD: password,
      },
    });
  } catch (error) {
    if (error.exitCode === EXIT_BAD_PASSWORD) {
      throw new Error(`El entorno rechaza la contraseña de ${key} por su política de contraseñas: cámbiala en /deckhand:settings`);
    }
    if (error.exitCode === EXIT_STUCK) {
      throw new Error("El login SSH se ha quedado atascado en el cambio de contraseña");
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
