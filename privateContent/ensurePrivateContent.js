const { getSetting } = require("../settings");
const { PASSWORD_SETTING } = require("./paths");
const privateContentStatus = require("./privateContentStatus");
const unlockPrivateContent = require("./unlockPrivateContent");

// Al arrancar: tras instalar o actualizar el plugin, su carpeta es nueva y hay que volver a descifrar
// con la contraseña ya guardada en el panel. Sin contraseña no hace nada.
const ensurePrivateContent = async () => {
	const status = privateContentStatus();
	if (!status.available || status.unlocked) return status;

	const password = getSetting(PASSWORD_SETTING);
	if (!password) return status;

	await unlockPrivateContent(password);
	return privateContentStatus();
};

module.exports = ensurePrivateContent;
