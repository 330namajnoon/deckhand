const { z } = require("zod");
const { retryPipeline } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "retry_pipeline",
	title: "Reintentar un pipeline de GitLab",
	description:
		"Vuelve a lanzar un pipeline de GitLab ya existente (como el botón 'Retry' de la UI de GitLab): reintenta sus jobs fallidos/cancelados, manteniendo el mismo id de pipeline. A diferencia de redeploy_entorno, no requiere que el deploy esté en la base de datos de deckhand — sirve para redesplegar pipelines/entornos que existen en GitLab pero se crearon fuera de esta herramienta. Usa list_pipelines primero para encontrar el pipelineId (filtrando por ref, la rama del entorno); tras reintentarlo, usa get_pipeline_jobs con el mismo pipelineId para comprobar cuándo termina (mira el stage 'deploy_workers').",
	inputSchema: {
		repositoryId: z.union([z.string(), z.number()]).describe("Id o path del repositorio en GitLab"),
		pipelineId: z.number().describe("Id del pipeline a reintentar, obtenido de list_pipelines"),
	},
	handler: async ({ repositoryId, pipelineId }) => jsonResult(await retryPipeline(repositoryId, pipelineId)),
};
