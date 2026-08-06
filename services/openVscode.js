const { getDeploy, HttpError, loginEntorno, openRemoteVscode } = require("../utils");

const openVscode = async (id) => {
	const deploy = await getDeploy(id);

	if (!deploy) {
		throw new HttpError(`No existe ningún deploy con id ${id}`, 404);
	}

	if (deploy.status !== "listo") {
		throw new HttpError(`El deploy está en estado "${deploy.status}", todavía no se puede abrir`, 409);
	}

	// Entrar primero por consola: si el entorno pide el cambio de contraseña
	// forzado (p. ej. tras un redeploy), se resuelve aquí para que la conexión
	// Remote-SSH de VS Code no se quede atascada en él.
	await loginEntorno(deploy);

	return openRemoteVscode(deploy.usuarioSsh, deploy.servidorSsh, deploy.puertoSsh, deploy.rutaRaiz);
};

module.exports = openVscode;
