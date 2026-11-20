const { getDeploy, HttpError, loginEntorno, openRemoteVscode } = require("../utils");

const openVscode = async (id) => {
	const deploy = await getDeploy(id);

	if (!deploy) {
		throw new HttpError(`No existe ningún deploy con id ${id}`, 404);
	}

	if (deploy.status !== "listo") {
		throw new HttpError(`El deploy está en estado "${deploy.status}", todavía no se puede abrir`, 409);
	}

	// Primero por consola, para que Remote-SSH no se atasque en el cambio de contraseña forzado.
	await loginEntorno(deploy);

	return openRemoteVscode(deploy.usuarioSsh, deploy.servidorSsh, deploy.puertoSsh, deploy.rutaRaiz);
};

module.exports = openVscode;
