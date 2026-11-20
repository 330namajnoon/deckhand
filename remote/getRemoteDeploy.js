const { getDeploy, HttpError } = require("../utils");

const getRemoteDeploy = async (id) => {
	const deploy = await getDeploy(id);

	if (!deploy) throw new HttpError(`No existe ningún deploy con id ${id}`, 404);
	if (deploy.type === "test") throw new HttpError("Los entornos de test no tienen acceso SSH", 400);
	if (deploy.status !== "listo") {
		throw new HttpError(`El deploy está en estado "${deploy.status}", todavía no se puede usar`, 409);
	}
	if (!deploy.servidorSsh || !deploy.puertoSsh) {
		throw new HttpError("El deploy no tiene datos de conexión SSH", 409);
	}

	return deploy;
};

module.exports = getRemoteDeploy;
