const { z } = require("zod");
const { listRemoteActions } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "list_remote_actions",
	title: "Ver la auditoría de acciones remotas",
	description:
		"Lista las últimas llamadas a las tools remote_* (comandos, lecturas, escrituras, queries), incluidas las bloqueadas por la política, más recientes primero. Opcionalmente filtradas por deploy.",
	annotations: { readOnlyHint: true },
	inputSchema: {
		deployId: z.string().optional(),
		limit: z.number().int().min(1).max(500).optional().describe("Por defecto 50"),
	},
	handler: async ({ deployId, limit }) => jsonResult(await listRemoteActions({ deployId, limit })),
};
