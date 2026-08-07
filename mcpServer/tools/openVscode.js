const { z } = require("zod");
const { getDeploy, HttpError } = require("../../utils");
const localInstallInstructions = require("../localInstallInstructions");
const { notFoundError } = require("../errors");
const { textResult } = require("../toolResult");

module.exports = {
	name: "open_vscode",
	title: "Abrir VS Code remoto",
	description:
		"Da los datos de conexión y las instrucciones para terminar la instalación del entorno de un deploy con status 'listo' (login SSH inicial, copia de la clave SSH) y abrir VS Code (Remote-SSH). No lo ejecuta deckhand: hay que ejecutar los comandos que devuelve en tu propia máquina, la del agente que llama al tool.",
	inputSchema: {
		deployId: z.string(),
	},
	handler: async ({ deployId }) => {
		const deploy = await getDeploy(deployId);

		if (!deploy) {
			throw notFoundError(`No existe ningún deploy con id ${deployId}`);
		}

		if (deploy.status !== "listo") {
			throw new HttpError(`El deploy está en estado "${deploy.status}", todavía no se puede abrir`, 409);
		}

		return textResult(localInstallInstructions(deploy));
	},
};
