const { z } = require("zod");
const { runRemoteAction, runDbQuery } = require("../../remote");
const { checkSql } = require("../../policy");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "remote_db_query",
	title: "Consultar la base de datos de un entorno",
	description:
		'Ejecuta UNA sentencia SQL en la base de datos MySQL/MariaDB del entorno de un deploy, con la conexión de su .env. Depende de la política de deckhand: en "deny" no se permite nada; en "readonly" solo SELECT/SHOW/EXPLAIN/DESCRIBE/WITH, dentro de una transacción READ ONLY; en "allow", cualquier sentencia. Si una query sale bloqueada, no la intentes por otra vía: díselo al usuario.',
	annotations: { destructiveHint: true, openWorldHint: true },
	inputSchema: {
		deployId: z.string(),
		sql: z.string().min(1),
		timeoutSeconds: z.number().int().min(1).max(300).optional().describe("Por defecto 60"),
	},
	handler: async (input) =>
		jsonResult(
			await runRemoteAction({ deployId: input.deployId, tool: "remote_db_query", input }, async ({ deploy, policy, block }) => {
				const check = checkSql(policy, input.sql);
				if (!check.allowed) block(check.reason);

				return runDbQuery(deploy, policy, input.sql, { timeoutMs: (input.timeoutSeconds ?? 60) * 1000 });
			})
		),
};
