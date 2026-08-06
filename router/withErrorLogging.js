const { logError } = require("../utils");

// Envuelve un controller para que ningún error asíncrono quede sin gestionar
// (Express 4 no captura promesas rechazadas y la petición se quedaría colgada):
// se registra en database/errors.log y se responde con un 500 coherente.
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
