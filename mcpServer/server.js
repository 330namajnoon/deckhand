const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { version } = require("../package.json");
const registerTools = require("./registerTools");

// Un McpServer por request: sin sesión compartida, cada llamada se autentica con su propio token.
const buildMcpServer = () => {
	const server = new McpServer({ name: "deckhand", version }, { capabilities: { tools: {} } });
	registerTools(server);
	return server;
};

module.exports = buildMcpServer;
