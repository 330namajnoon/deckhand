const { z } = require("zod");
const { listPipelineStages } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "get_pipeline_jobs",
	title: "Consultar stages y jobs de un pipeline",
	description:
		"Devuelve los stages de un pipeline de GitLab con sus jobs y estados (mismo mecanismo que usa create_deploy internamente para esperar a que termine). Úsalo tras list_pipelines para comprobar si un deploy ya ha terminado: busca el stage 'deploy_workers' (el que marca el entorno como listo) y mira su status — 'success' significa terminado, 'failed'/'canceled' significa que falló (revisa el job correspondiente), cualquier otro valor significa que sigue en curso.",
	inputSchema: {
		repositoryId: z.union([z.string(), z.number()]).describe("Id o path del repositorio en GitLab"),
		pipelineId: z.number().describe("Id del pipeline, obtenido de list_pipelines"),
	},
	handler: async ({ repositoryId, pipelineId }) => jsonResult(await listPipelineStages(repositoryId, pipelineId)),
};
