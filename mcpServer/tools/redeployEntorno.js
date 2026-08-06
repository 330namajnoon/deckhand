const { z } = require("zod");
const { redeployEntorno } = require("../../services");
const { textResult } = require("../toolResult");

module.exports = {
	name: "redeploy_entorno",
	title: "Redesplegar un entorno",
	description:
		"Vuelve a desplegar el entorno de un deploy existente. Se ejecuta en segundo plano: sondear get_deploy con el mismo id (~cada 5s) hasta que el status sea 'listo' o 'error'.",
	inputSchema: {
		deployId: z.string(),
	},
	handler: async ({ deployId }) => {
		const deploy = await redeployEntorno(deployId);

		return textResult(
			`Redeploy encolado para el deploy ${deploy.id}, status "${deploy.status}". Sondear get_deploy con este id (~cada 5s) hasta que el status sea "listo" o "error".\n\n${JSON.stringify(deploy, null, 2)}`
		);
	},
};
