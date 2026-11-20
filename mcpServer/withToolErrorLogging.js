const { logError } = require("../utils");

const withToolErrorLogging = (toolName, handler) => async (args, extra) => {
	try {
		return await handler(args, extra);
	} catch (error) {
		if (!error.alreadyLogged) {
			console.error(`❌ Error en tool MCP "${toolName}":`, error);
			await logError(`mcp tool ${toolName}`, error, { args });
		}

		return { isError: true, content: [{ type: "text", text: error.message ?? "Error desconocido" }] };
	}
};

module.exports = withToolErrorLogging;
