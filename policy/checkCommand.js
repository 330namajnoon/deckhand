const { DATABASE_COMMAND_PATTERNS } = require("./defaults");

// Red contra errores de un agente de buena fe, no una barrera de seguridad: cualquier regex se puede esquivar.
const checkCommand = (policy, command) => {
	const rules = [
		...(policy.database === "allow"
			? []
			: DATABASE_COMMAND_PATTERNS.map((rule) => ({
					...rule,
					reason: `${rule.reason}: la política de base de datos es "${policy.database}"${
						policy.database === "readonly" ? " (usa remote_db_query para leer)" : ""
					}`,
				}))),
		...policy.commandDenyPatterns,
	];

	const hit = rules.find(({ pattern }) => new RegExp(pattern, "i").test(command));
	return hit ? { allowed: false, reason: `${hit.reason || "Prohibido por la política"} (regla: ${hit.pattern})` } : { allowed: true };
};

module.exports = checkCommand;
