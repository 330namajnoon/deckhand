const { z } = require("zod");
const { searchRepository } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "search_repository",
	title: "Buscar texto en un repositorio",
	description:
		"Busca un texto o término dentro del contenido de los archivos de un repositorio (como un grep remoto), sin necesidad de leer el árbol completo. Solo busca en la rama por defecto del repo (la búsqueda de GitLab a nivel de proyecto no permite fijar otra ref); para leer el contenido completo de un archivo concreto usa get_repository_file.",
	inputSchema: {
		repositoryId: z.union([z.string(), z.number()]).describe("Id o path del repositorio en GitLab"),
		search: z.string().describe("Texto a buscar en el contenido de los archivos"),
	},
	handler: async ({ repositoryId, search }) => jsonResult(await searchRepository(repositoryId, search)),
};
