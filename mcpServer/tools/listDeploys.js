const { z } = require("zod");
const { listDeploys } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "list_deploys",
	title: "Listar deploys",
	description:
		"Lista deploys, más recientes primero. Sin filtros la respuesta puede ser enorme (decenas de miles de caracteres): usa branchName/projectName/status/limit para acotar. compact (true por defecto) trae solo id/branchName/projectName/status/url; pon compact:false solo con pocos resultados ya filtrados si necesitas el resto de campos (datos SSH, error completo, etc.).",
	inputSchema: {
		branchName: z.string().optional().describe("Filtra por coincidencia parcial del nombre de rama"),
		projectName: z.string().optional().describe("Filtra por coincidencia parcial del nombre del repositorio"),
		status: z.enum(["creando", "instalando", "listo", "error"]).optional(),
		limit: z.number().int().positive().optional().describe("Máximo de resultados (por defecto sin límite)"),
		compact: z
			.boolean()
			.default(true)
			.describe("Si es true (por defecto), cada deploy solo trae id/branchName/projectName/status/url"),
	},
	handler: async ({ branchName, projectName, status, limit, compact }) => {
		const deploys = await listDeploys({ branchName, projectName, status, limit });

		if (!compact) return jsonResult(deploys);

		return jsonResult(deploys.map(({ id, branchName, projectName, status, url }) => ({ id, branchName, projectName, status, url })));
	},
};
