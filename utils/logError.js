const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = require("../database/dataDir");

const ERRORS_LOG = path.join(DATA_DIR, "errors.log");

// Nunca lanza: un fallo al escribir el log no debe tapar el error original.
const logError = async (context, error, details) => {
	const entry = {
		timestamp: new Date().toISOString(),
		context,
		message: error?.message ?? String(error),
		stack: error?.stack,
		...(error?.cause ? { cause: error.cause } : {}),
		...(details ? { details } : {}),
	};

	try {
		await fs.appendFile(ERRORS_LOG, JSON.stringify(entry) + "\n");
	} catch (writeError) {
		console.error("❌ No se ha podido escribir en errors.log:", writeError);
	}

	return entry;
};

module.exports = logError;
