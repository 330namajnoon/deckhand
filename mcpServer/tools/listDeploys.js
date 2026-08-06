const { listDeploys } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "list_deploys",
	title: "Listar deploys",
	description: "Lista todos los deploys, más recientes primero.",
	inputSchema: {},
	handler: async () => jsonResult(await listDeploys()),
};
