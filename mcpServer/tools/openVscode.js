const { z } = require("zod");
const { openVscode } = require("../../services");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "open_vscode",
	title: "Abrir VS Code remoto",
	description:
		'Abre en VS Code (Remote-SSH) el entorno de un deploy con status "listo". Se abre en la máquina donde corre deckhand (con el plugin, la del propio usuario) a través de la URL vscode://; necesita VS Code con la extensión Remote-SSH. Antes resuelve el cambio de contraseña forzado del entorno si hace falta.',
	inputSchema: {
		deployId: z.string(),
	},
	handler: async ({ deployId }) => jsonResult(await openVscode(deployId)),
};
