const { z } = require("zod");
const { runRemoteAction, sftp, resolveRemotePath } = require("../../remote");
const { checkWritePath } = require("../../policy");
const { jsonResult } = require("../toolResult");

const countOccurrences = (text, search) => text.split(search).length - 1;

module.exports = {
	name: "remote_edit_file",
	title: "Editar un fichero de un entorno",
	description:
		"Sustituye un texto exacto por otro en un fichero del entorno de un deploy. `oldString` tiene que coincidir exactamente (espacios e indentación incluidos) y ser único en el fichero, salvo con replaceAll. Lee antes el fichero con remote_read_file. La ruta es relativa a la raíz del proyecto (rutaRaiz) o absoluta.",
	annotations: { destructiveHint: true, openWorldHint: true },
	inputSchema: {
		deployId: z.string(),
		path: z.string().min(1),
		oldString: z.string().min(1),
		newString: z.string(),
		replaceAll: z.boolean().optional(),
	},
	handler: async (input) =>
		jsonResult(
			await runRemoteAction({ deployId: input.deployId, tool: "remote_edit_file", input }, async ({ deploy, policy, block }) => {
				const target = resolveRemotePath(deploy, input.path);
				const check = checkWritePath(policy, target, resolveRemotePath(deploy));
				if (!check.allowed) block(check.reason);
				if (input.oldString === input.newString) throw new Error("oldString y newString son iguales");

				const content = (await sftp.readFile(deploy, target)).toString("utf8");
				const count = countOccurrences(content, input.oldString);
				if (count === 0) throw new Error(`oldString no aparece en ${target}`);
				if (count > 1 && !input.replaceAll) {
					throw new Error(`oldString aparece ${count} veces en ${target}: amplía el contexto para que sea único o usa replaceAll`);
				}

				const next = input.replaceAll
					? content.split(input.oldString).join(input.newString)
					: content.replace(input.oldString, () => input.newString);
				await sftp.writeFile(deploy, target, next);
				return { path: target, replacements: input.replaceAll ? count : 1 };
			})
		),
};
