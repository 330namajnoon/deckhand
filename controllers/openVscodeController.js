const { createController } = require("sm-express-server");
const { getDeploy, loginEntorno, openRemoteVscode } = require("../utils");

const openVscodeController = createController(async (req, res) => {
	const { id } = req.params;

	const deploy = await getDeploy(id);

	if (!deploy) {
		return res.status(404).send({ error: `No existe ningún deploy con id ${id}` });
	}

	if (deploy.status !== "listo") {
		return res.status(409).send({ error: `El deploy está en estado "${deploy.status}", todavía no se puede abrir` });
	}

	// Entrar primero por consola: si el entorno pide el cambio de contraseña
	// forzado (p. ej. tras un redeploy), se resuelve aquí para que la conexión
	// Remote-SSH de VS Code no se quede atascada en él.
	await loginEntorno(deploy);

	const result = await openRemoteVscode(deploy.usuarioSsh, deploy.servidorSsh, deploy.puertoSsh, deploy.rutaRaiz);

	res.send(result);
});

module.exports = openVscodeController;
