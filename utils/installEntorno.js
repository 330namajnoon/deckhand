const loginEntorno = require("./loginEntorno");
const copySshKeyToEntorno = require("./copySshKeyToEntorno");
const logError = require("./logError");

// Un fallo al copiar la clave SSH se registra pero no tumba la instalación.
async function installEntorno(entorno) {
  await loginEntorno(entorno);

  let sshKey;
  try {
    sshKey = await copySshKeyToEntorno(entorno);
  } catch (error) {
    sshKey = { copied: false, reason: error.message };
  }

  if (sshKey.copied) console.log(`🔑 Clave SSH copiada al entorno (${sshKey.remotePath})`);
  else {
    console.warn(`⚠️ No se ha copiado la clave SSH al entorno: ${sshKey.reason}`);
    await logError("installEntorno: copiar clave SSH", new Error(sshKey.reason), { servidorSsh: entorno.servidorSsh, puertoSsh: entorno.puertoSsh });
  }

  return { success: true, sshKey };
}

module.exports = installEntorno;
