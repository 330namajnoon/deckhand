const { z } = require("zod");
const { openVscode } = require("../../services");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "open_vscode",
	title: "Abrir VS Code remoto",
	description:
		'Abre en VS Code (Remote-SSH) el entorno de un deploy con status "listo". Se abre en la máquina donde corre deckhand (con el plugin, la del propio usuario); necesita el comando `code` en el PATH.',
	inputSchema: {
		deployId: z.string(),
	},
	handler: async ({ deployId }) => jsonResult(await openVscode(deployId)),
};
