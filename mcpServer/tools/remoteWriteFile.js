const path = require("path");
const { z } = require("zod");
const { runRemoteAction, sftp, resolveRemotePath } = require("../../remote");
const { checkWritePath } = require("../../policy");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "remote_write_file",
	title: "Escribir un fichero en un entorno",
	description:
		"Crea o sobrescribe un fichero en el entorno de un deploy (por SFTP), creando las carpetas que falten. La ruta es relativa a la raíz del proyecto (rutaRaiz) o absoluta. Para cambiar parte de un fichero existente usa remote_edit_file. Algunas rutas están protegidas por la política de deckhand.",
	annotations: { destructiveHint: true, openWorldHint: true },
	inputSchema: {
		deployId: z.string(),
		path: z.string().min(1),
		content: z.string(),
	},
	handler: async (input) =>
		jsonResult(
			await runRemoteAction({ deployId: input.deployId, tool: "remote_write_file", input }, async ({ deploy, policy, block }) => {
				const target = resolveRemotePath(deploy, input.path);
				const check = checkWritePath(policy, target, resolveRemotePath(deploy));
				if (!check.allowed) block(check.reason);

				const existed = await sftp.exists(deploy, target);
				await sftp.mkdirp(deploy, path.posix.dirname(target));
				await sftp.writeFile(deploy, target, input.content);
				return { path: target, created: !existed, bytes: Buffer.byteLength(input.content) };
			})
		),
};
