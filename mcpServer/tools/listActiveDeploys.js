const { z } = require("zod");
const { listActiveDeploys } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "list_active_deploys",
	title: "Listar deploys en curso",
	description:
		"Lista los deploys en curso (status creando o instalando), más recientes primero. Útil para comprobar si ya hay un deploy en marcha para un repo/rama antes de lanzar uno nuevo con create_deploy, o para hacer seguimiento de los que están en progreso sin tener que filtrar a mano la lista completa. compact (true por defecto) trae solo id/branchName/projectName/status/url; pon compact:false solo con pocos resultados ya filtrados si necesitas el resto de campos.",
	inputSchema: {
		branchName: z.string().optional().describe("Filtra por coincidencia parcial del nombre de rama"),
		projectName: z.string().optional().describe("Filtra por coincidencia parcial del nombre del repositorio"),
		limit: z.number().int().positive().optional().describe("Máximo de resultados (por defecto sin límite)"),
		compact: z
			.boolean()
			.default(true)
			.describe("Si es true (por defecto), cada deploy solo trae id/branchName/projectName/status/url"),
	},
	handler: async ({ branchName, projectName, limit, compact }) => {
		const deploys = await listActiveDeploys({ branchName, projectName, limit });

		if (!compact) return jsonResult(deploys);

		return jsonResult(deploys.map(({ id, branchName, projectName, status, url }) => ({ id, branchName, projectName, status, url })));
	},
};
