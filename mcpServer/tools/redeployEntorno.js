const { z } = require("zod");
const { redeployEntorno } = require("../../services");
const { textResult } = require("../toolResult");

module.exports = {
	name: "redeploy_entorno",
	title: "Redesplegar un entorno",
	description:
		"Vuelve a desplegar el entorno de un deploy existente. Se ejecuta en segundo plano: sondear get_deploy con el mismo id (~cada 5s) hasta que el status sea 'listo' o 'error'. El login SSH inicial, la copia de la clave SSH y la apertura de VS Code NO los hace deckhand: cuando el status sea 'listo', usar el tool open_vscode con este mismo id para obtener los datos e instrucciones y hacerlo en tu propia máquina.",
	inputSchema: {
		deployId: z.string(),
	},
	handler: async ({ deployId }) => {
		const deploy = await redeployEntorno(deployId, false);

		return textResult(
			`Redeploy encolado para el deploy ${deploy.id}, status "${deploy.status}". Sondear get_deploy con este id (~cada 5s) hasta que el status sea "listo" o "error". Cuando esté "listo" hay que llamar a open_vscode con este id para terminar la instalación en tu máquina y abrir VS Code.\n\n${JSON.stringify(deploy, null, 2)}`
		);
	},
};
