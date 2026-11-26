// stdout es el canal MCP: el transporte usa su propia referencia y el resto de escrituras se desvía a stderr.
const { Writable } = require("stream");

const writeProtocol = process.stdout.write.bind(process.stdout);
process.stdout.write = process.stderr.write.bind(process.stderr);
console.log = console.error;
console.info = console.error;

const protocolOut = new Writable({
	write(chunk, encoding, callback) {
		writeProtocol(chunk, encoding, callback);
	},
});

// Solo en desarrollo: el .env de la raíz del repo, nunca el del cwd (con el plugin es el proyecto del usuario).
// Debe ir antes de cualquier require propio.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), quiet: true });

const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const buildMcpServer = require("./server");
const { logError } = require("../utils");
const { ensurePrivateContent } = require("../privateContent");

const main = async () => {
	const server = buildMcpServer();
	await server.connect(new StdioServerTransport(process.stdin, protocolOut));
	console.error("deckhand MCP (stdio) listo");

	// Tras instalar o actualizar el plugin su carpeta es nueva: se vuelve a descifrar con la contraseña guardada.
	ensurePrivateContent().catch((error) => logError("private content unlock (stdio)", error));
};

process.on("unhandledRejection", (reason) => {
	console.error("❌ Promesa rechazada sin gestionar:", reason);
	logError("unhandledRejection (stdio)", reason);
});

main().catch(async (error) => {
	console.error("❌ No se ha podido arrancar el servidor MCP:", error);
	await logError("mcp stdio startup", error);
	process.exit(1);
});
