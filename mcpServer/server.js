const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { version } = require("../package.json");
const registerTools = require("./registerTools");

// Se crea un McpServer nuevo por request (ver router.js): sin sesión
// compartida entre llamadas, cada una se autentica de forma independiente
// vía su propio Bearer token.
const buildMcpServer = () => {
	const server = new McpServer({ name: "deckhand", version }, { capabilities: { tools: {} } });
	registerTools(server);
	return server;
};

module.exports = buildMcpServer;
