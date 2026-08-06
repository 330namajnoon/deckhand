const { z } = require("zod");
const { getRepositoryFile } = require("../../utils");
const { textResult } = require("../toolResult");

module.exports = {
	name: "get_repository_file",
	title: "Leer un archivo del repositorio",
	description: "Devuelve el contenido (utf8) de un archivo de un repositorio en una ref dada.",
	inputSchema: {
		repositoryId: z.union([z.string(), z.number()]).describe("Id o path del repositorio en GitLab"),
		ref: z.string().describe("Rama, tag o commit"),
		path: z.string().describe("Ruta del archivo dentro del repo"),
	},
	handler: async ({ repositoryId, ref, path }) => textResult(await getRepositoryFile(repositoryId, ref, path)),
};
