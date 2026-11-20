const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { logError } = require("../utils");
const buildMcpServer = require("./server");

const methodNotAllowed = (_req, res) =>
	res.writeHead(405).end(
		JSON.stringify({
			jsonrpc: "2.0",
			error: { code: -32000, message: "Method not allowed." },
			id: null,
		})
	);

const handlePost = async (req, res) => {
	const server = buildMcpServer();

	try {
		const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
		await server.connect(transport);
		await transport.handleRequest(req, res, req.body);

		res.on("close", () => {
			transport.close();
			server.close();
		});
	} catch (error) {
		console.error("❌ Error en petición MCP:", error);
		await logError("POST /mcp", error, { body: req.body });

		if (!res.headersSent) {
			res.status(500).json({
				jsonrpc: "2.0",
				error: { code: -32603, message: "Internal server error" },
				id: null,
			});
		}
	}
};

module.exports = { handlePost, methodNotAllowed };
