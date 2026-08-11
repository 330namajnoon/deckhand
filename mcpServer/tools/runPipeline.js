const { z } = require("zod");
const { createPipeline } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "run_pipeline",
	title: "Lanzar un pipeline nuevo en GitLab",
	description:
		"Lanza un pipeline nuevo de GitLab sobre una rama/ref ya existente (como el botón 'Run pipeline' de la UI de GitLab). A diferencia de retry_pipeline, crea un pipeline con id nuevo en vez de reintentar uno ya terminado; a diferencia de redeploy_entorno, no requiere que el deploy esté en la base de datos de deckhand — sirve para lanzar/redesplegar directamente entornos o ramas que existen en GitLab pero se crearon fuera de esta herramienta. Usa get_repository_branches para confirmar el nombre exacto de la rama si no lo tienes. Tras lanzarlo, usa list_pipelines (filtrando por ref) para obtener el pipelineId y get_pipeline_jobs para comprobar cuándo termina (mira el stage 'deploy_workers').",
	inputSchema: {
		repositoryId: z.union([z.string(), z.number()]).describe("Id o path del repositorio en GitLab"),
		ref: z.string().describe("Rama o tag existente sobre la que lanzar el pipeline"),
		variables: z
			.record(z.string(), z.string())
			.optional()
			.describe("Variables opcionales del pipeline, ej. { deleteFilesBranchEntorno: \"true\" }. Los valores deben ser strings."),
	},
	handler: async ({ repositoryId, ref, variables }) => jsonResult(await createPipeline(repositoryId, ref, variables)),
};
