const { getSetting } = require("../settings");

// Los entornos de CRM rechazan la contraseña general por su política de pam_pwquality.
const isCrmEntorno = (entorno) => /crm/i.test([entorno.projectName, entorno.project?.name, entorno.entornoName].filter(Boolean).join(" "));

const getEntornoPassword = (entorno) => {
	const crmPassword = isCrmEntorno(entorno) ? getSetting("ENTORNO_NEW_PASSWORD_CRM") : "";
	if (crmPassword) return { key: "ENTORNO_NEW_PASSWORD_CRM", password: crmPassword };

	const password = getSetting("ENTORNO_NEW_PASSWORD");
	if (!password) {
		throw new Error("Falta ENTORNO_NEW_PASSWORD: configúrala en el panel de deckhand (/deckhand:settings)");
	}
	return { key: "ENTORNO_NEW_PASSWORD", password };
};

module.exports = getEntornoPassword;
