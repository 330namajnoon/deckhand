const db = require("../database/client");

// La auditoría guarda qué se hizo, no una copia del contenido.
const MAX_FIELD = 2000;

const trimInput = (input) =>
	Object.fromEntries(
		Object.entries(input).map(([key, value]) =>
			typeof value === "string" && value.length > MAX_FIELD
				? [key, `${value.slice(0, MAX_FIELD)}… [${value.length} caracteres]`]
				: [key, value]
		)
	);

// Nunca lanza: un fallo de auditoría no debe tapar el resultado de la tool.
const logRemoteAction = ({ deployId, tool, input, allowed, blockedReason, exitCode, error, durationMs }) => {
	try {
		db.prepare(
			`INSERT INTO remote_actions (deployId, tool, input, allowed, blockedReason, exitCode, error, durationMs, createdAt)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			deployId,
			tool,
			JSON.stringify(trimInput(input)),
			allowed ? 1 : 0,
			blockedReason ?? null,
			exitCode ?? null,
			error ?? null,
			durationMs ?? null,
			new Date().toISOString()
		);
	} catch (writeError) {
		console.error("❌ No se ha podido registrar la acción remota:", writeError);
	}
};

module.exports = logRemoteAction;
