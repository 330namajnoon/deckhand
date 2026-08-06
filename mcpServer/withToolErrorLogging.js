const { logError } = require("../utils");

// Envuelve el handler de un tool MCP para que ningún error quede sin loggear
// ni tumbe la conexión: éxito -> lo que devuelva el handler; error -> tool
// result con isError:true (así el agente ve el fallo como resultado del
// tool, no como error de transporte). Los HttpError de services/ (400/404/
// 409/502) ya se loggean (o no hace falta) en origen, así que alreadyLogged
// evita duplicar el log — mismo criterio que router/withErrorLogging.js.
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
