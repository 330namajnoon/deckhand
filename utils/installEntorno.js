const os = require("os");
const loginEntorno = require("./loginEntorno");
const runExpect = require("./runExpect");

/**
 * Instala el entorno recién creado: se conecta por SSH usando la cadena de
 * conexión, responde al cambio de contraseña forzado (contraseña actual =
 * contrasenaSsh, nueva contraseña vacía, entrando directamente) y después
 * copia la clave SSH local al servidor mediante scp.
 *
 * @param {{
 *   usuarioSsh: string,
 *   contrasenaSsh: string,
 *   servidorSsh: string,
 *   puertoSsh: string,
 *   cadenaConexionSsh: string
 * }} entorno - Objeto devuelto por createEntorno.
 * @returns {Promise<{ success: true }>}
 */
async function installEntorno(entorno) {
  const { usuarioSsh, contrasenaSsh, servidorSsh, puertoSsh } = entorno;

  // Paso 1: primera conexión SSH con cambio de contraseña forzado.
  await loginEntorno(entorno);

  // Paso 2: copiar la clave SSH local al servidor.
  const scpCommand = `scp -P ${puertoSsh} ${os.homedir()}/.ssh/id_ed25519 ${usuarioSsh}@${servidorSsh}:~/.ssh/id_rsa`;
  await runExpect(`
    set timeout 60
    spawn ${scpCommand}
    expect {
      -re "(yes/no|fingerprint)" { send "yes\\r"; exp_continue }
      -re "(?i)password:" { send "${contrasenaSsh}\\r"; exp_continue }
      eof
    }
  `);

  return { success: true };
}

module.exports = installEntorno;
