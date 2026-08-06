const { z } = require("zod");
const { openVscode } = require("../../services");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "open_vscode",
	title: "Abrir VS Code remoto",
	description:
		'Abre en VS Code (Remote-SSH) el entorno de un deploy con status "listo". Ojo: se abre en la máquina donde corre el servidor de deckhand, no en la del agente que llama al tool.',
	inputSchema: {
		deployId: z.string(),
	},
	handler: async ({ deployId }) => jsonResult(await openVscode(deployId)),
};
