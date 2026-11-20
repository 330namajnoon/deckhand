const { logError } = require("../utils");

// Express 4 no captura promesas rechazadas: sin esto la petición se quedaría colgada.
const withErrorLogging = (controller) => async (req, res) => {
	try {
		await controller(req, res);
	} catch (error) {
		const context = `${req.method} ${req.originalUrl}`;
		console.error(`❌ Error en ${context}:`, error);
		await logError(context, error, { params: req.params, query: req.query, body: req.body });

		if (!res.headersSent) {
			res.status(500).send({ error: error.message ?? "Error interno del servidor" });
		}
	}
};

module.exports = withErrorLogging;
