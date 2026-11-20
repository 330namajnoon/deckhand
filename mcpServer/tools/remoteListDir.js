const { z } = require("zod");
const { runRemoteAction, sftp, resolveRemotePath } = require("../../remote");
const { jsonResult } = require("../toolResult");

const typeOf = (attrs) => (attrs.isDirectory() ? "dir" : attrs.isSymbolicLink() ? "link" : attrs.isFile() ? "file" : "other");

module.exports = {
	name: "remote_list_dir",
	title: "Listar una carpeta de un entorno",
	description:
		"Lista el contenido de una carpeta del entorno de un deploy (por SFTP): nombre, tipo, tamaño y fecha de modificación. La ruta es relativa a la raíz del proyecto (rutaRaiz) o absoluta; por defecto, la raíz. Para buscar en el árbol usa remote_exec con find o grep.",
	annotations: { readOnlyHint: true, openWorldHint: true },
	inputSchema: {
		deployId: z.string(),
		path: z.string().optional(),
	},
	handler: async (input) =>
		jsonResult(
			await runRemoteAction({ deployId: input.deployId, tool: "remote_list_dir", input }, async ({ deploy }) => {
				const target = resolveRemotePath(deploy, input.path);
				const entries = await sftp.readdir(deploy, target);
				return {
					path: target,
					entries: entries
						.map(({ filename, attrs }) => ({
							name: filename,
							type: typeOf(attrs),
							size: attrs.size,
							modifiedAt: new Date(attrs.mtime * 1000).toISOString(),
						}))
						.sort((a, b) => (b.type === "dir") - (a.type === "dir") || a.name.localeCompare(b.name)),
				};
			})
		),
};
