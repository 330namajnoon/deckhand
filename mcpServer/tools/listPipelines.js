const { z } = require("zod");
const { listPipelines } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "list_pipelines",
	title: "Listar pipelines de un repositorio",
	description:
		"Lista los pipelines de GitLab de un repositorio, más reciente primero. Filtra por ref (rama del entorno) para encontrar el pipeline de un deploy concreto; el id de cada pipeline se usa luego en get_pipeline_jobs para ver sus stages/jobs y comprobar si ha terminado.",
	inputSchema: {
		repositoryId: z.union([z.string(), z.number()]).describe("Id o path del repositorio en GitLab"),
		ref: z.string().optional().describe("Filtra por rama, ej. el nombre del entorno"),
		status: z
			.enum(["created", "waiting_for_resource", "preparing", "pending", "running", "success", "failed", "canceled", "skipped", "manual", "scheduled"])
			.optional()
			.describe("Filtra por estado del pipeline"),
		limit: z.number().int().positive().optional().describe("Máximo de resultados (por defecto sin límite)"),
	},
	handler: async ({ repositoryId, ref, status, limit }) =>
		jsonResult(
			await listPipelines(repositoryId, {
				...(ref && { ref }),
				...(status && { status }),
				...(limit && { maxPages: 1, perPage: limit }),
			})
		),
};
