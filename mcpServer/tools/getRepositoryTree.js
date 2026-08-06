const { z } = require("zod");
const { listRepositoryTree } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "get_repository_tree",
	title: "Listar árbol de archivos",
	description: "Lista los ficheros y carpetas de un repositorio en una ref y path dados.",
	inputSchema: {
		repositoryId: z.union([z.string(), z.number()]).describe("Id o path del repositorio en GitLab"),
		ref: z.string().describe("Rama, tag o commit"),
		path: z.string().default("").describe("Carpeta dentro del repo, vacío para la raíz"),
		recursive: z.boolean().default(false),
	},
	handler: async ({ repositoryId, ref, path, recursive }) => jsonResult(await listRepositoryTree(repositoryId, ref, path, recursive)),
};
