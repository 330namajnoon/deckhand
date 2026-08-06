const { listRepositories } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "list_repositories",
	title: "Listar repositorios",
	description: "Lista los repositorios de GitLab disponibles.",
	inputSchema: {},
	handler: async () => jsonResult(await listRepositories()),
};
