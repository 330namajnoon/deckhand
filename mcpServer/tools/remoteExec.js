const { z } = require("zod");
const { runRemoteAction, execCommand, resolveRemotePath } = require("../../remote");
const { checkCommand } = require("../../policy");
const { jsonResult } = require("../toolResult");

const MAX_TIMEOUT_S = 600;

module.exports = {
	name: "remote_exec",
	title: "Ejecutar un comando en un entorno",
	description:
		'Ejecuta un comando de shell (bash) por SSH en el entorno de un deploy con status "listo". Devuelve stdout, stderr y exitCode (la salida se recorta a 100 KB por stream). `cwd` es relativo a la raíz del proyecto (rutaRaiz) o absoluto. La política de deckhand bloquea algunos comandos (p. ej. clientes de base de datos): si un comando sale bloqueado, no intentes esquivarlo con otra forma de hacer lo mismo; díselo al usuario. Para leer o modificar ficheros usa mejor remote_read_file / remote_edit_file / remote_write_file.',
	annotations: { destructiveHint: true, openWorldHint: true },
	inputSchema: {
		deployId: z.string(),
		command: z.string().min(1),
		cwd: z.string().optional().describe("Directorio de trabajo; por defecto la raíz del proyecto"),
		timeoutSeconds: z.number().int().min(1).max(MAX_TIMEOUT_S).optional().describe("Por defecto 120"),
	},
	handler: async (input) =>
		jsonResult(
			await runRemoteAction({ deployId: input.deployId, tool: "remote_exec", input }, async ({ deploy, policy, block }) => {
				const check = checkCommand(policy, input.command);
				if (!check.allowed) block(check.reason);

				const cwd = resolveRemotePath(deploy, input.cwd);
				const result = await execCommand(deploy, input.command, { cwd, timeoutMs: (input.timeoutSeconds ?? 120) * 1000 });
				return { cwd, ...result };
			})
		),
};
