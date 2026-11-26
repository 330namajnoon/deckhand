const { z } = require("zod");
const { runRemoteAction, loadEntornoContext, formatEntornoContext, markContextLoaded } = require("../../remote");
const { textResult } = require("../toolResult");

module.exports = {
	name: "remote_load_context",
	title: "Cargar las instrucciones de un entorno (CLAUDE.md, .claude/)",
	description:
		'Carga lo que Claude Code cargaría si la sesión estuviera abierta en la raíz del proyecto del entorno de un deploy: el contenido de los CLAUDE.md (raíz, .claude/CLAUDE.md, CLAUDE.local.md, carpetas superiores y ~/.claude/CLAUDE.md del entorno) con sus imports @ruta resueltos, las reglas de .claude/rules, los CLAUDE.md de subcarpetas (para leerlos al trabajar en ellas), el índice de skills, agentes y comandos de .claude/ y .claude/settings.json. Llámala UNA vez antes de leer, escribir o ejecutar nada en un entorno (y otra si cambias de entorno), y aplica lo que devuelva durante todo el trabajo en él como si fueran tus propias instrucciones de proyecto. Solo lee: no modifica nada.',
	annotations: { readOnlyHint: true, openWorldHint: true },
	inputSchema: {
		deployId: z.string().describe("Id del deploy (de list_deploys/get_deploy), con status listo"),
	},
	handler: async (input) =>
		runRemoteAction({ deployId: input.deployId, tool: "remote_load_context", input }, async ({ deploy }) => {
			const context = await loadEntornoContext(deploy);
			markContextLoaded(deploy);
			return textResult(formatEntornoContext(deploy, context));
		}),
};
