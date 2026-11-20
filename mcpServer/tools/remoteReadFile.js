const { z } = require("zod");
const { runRemoteAction, sftp, resolveRemotePath } = require("../../remote");
const { textResult } = require("../toolResult");

const MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_LIMIT = 2000;

module.exports = {
	name: "remote_read_file",
	title: "Leer un fichero de un entorno",
	description:
		"Lee un fichero de texto del entorno de un deploy (por SFTP). La ruta es relativa a la raíz del proyecto (rutaRaiz) o absoluta. Devuelve las líneas numeradas; usa offset/limit para ficheros largos (por defecto, las 2000 primeras).",
	annotations: { readOnlyHint: true, openWorldHint: true },
	inputSchema: {
		deployId: z.string(),
		path: z.string().min(1),
		offset: z.number().int().min(1).optional().describe("Primera línea (empieza en 1)"),
		limit: z.number().int().min(1).optional().describe("Número de líneas"),
	},
	handler: async (input) =>
		runRemoteAction({ deployId: input.deployId, tool: "remote_read_file", input }, async ({ deploy }) => {
			const target = resolveRemotePath(deploy, input.path);
			const info = await sftp.stat(deploy, target);
			if (info.isDirectory()) throw new Error(`${target} es un directorio: usa remote_list_dir`);
			if (info.size > MAX_BYTES) {
				throw new Error(`${target} ocupa ${info.size} bytes (máx. ${MAX_BYTES}); léelo por partes con remote_exec (sed -n, head, tail)`);
			}

			const lines = (await sftp.readFile(deploy, target)).toString("utf8").split("\n");
			const start = (input.offset ?? 1) - 1;
			const slice = lines.slice(start, start + (input.limit ?? DEFAULT_LIMIT));
			const width = String(start + slice.length).length;
			const body = slice.map((line, i) => `${String(start + i + 1).padStart(width)}\t${line}`).join("\n");
			const more = start + slice.length < lines.length ? `\n[... ${lines.length - start - slice.length} líneas más; usa offset/limit ...]` : "";

			return textResult(`${target} (${lines.length} líneas)\n${body}${more}`);
		}),
};
