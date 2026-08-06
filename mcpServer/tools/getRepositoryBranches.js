const { z } = require("zod");
const { listBranches } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "get_repository_branches",
	title: "Listar ramas de un repositorio",
	description: "Lista las ramas de un repositorio de GitLab.",
	inputSchema: {
		repositoryId: z.union([z.string(), z.number()]).describe("Id o path del repositorio en GitLab"),
	},
	handler: async ({ repositoryId }) => jsonResult(await listBranches(repositoryId)),
};
