const { z } = require("zod");
const { getDeploy } = require("../../utils");
const { notFoundError } = require("../errors");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "get_deploy",
	title: "Consultar un deploy",
	description: "Devuelve el estado y datos de un deploy por su id. Usar para sondear un deploy tras create_deploy o redeploy_entorno.",
	inputSchema: {
		deployId: z.string(),
	},
	handler: async ({ deployId }) => {
		const deploy = await getDeploy(deployId);

		if (!deploy) {
			throw notFoundError(`No existe ningún deploy con id ${deployId}`);
		}

		return jsonResult(deploy);
	},
};
