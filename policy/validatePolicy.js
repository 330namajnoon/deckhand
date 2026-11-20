const DATABASE_MODES = ["deny", "readonly", "allow"];

const rules = (list, name, { regex }) => {
	if (!Array.isArray(list)) throw new Error(`${name} tiene que ser una lista`);
	return list.map((rule, i) => {
		const pattern = typeof rule?.pattern === "string" ? rule.pattern.trim() : "";
		if (!pattern) throw new Error(`${name}[${i}]: falta el patrón`);
		if (regex) {
			try {
				new RegExp(pattern, "i");
			} catch (error) {
				throw new Error(`${name}[${i}]: regex inválida (${error.message})`);
			}
		}
		return { pattern, reason: typeof rule.reason === "string" ? rule.reason.trim() : "" };
	});
};

const strings = (list, name) => {
	if (!Array.isArray(list) || list.some((v) => typeof v !== "string" || !v.trim())) {
		throw new Error(`${name} tiene que ser una lista de textos`);
	}
	return list.map((v) => v.trim());
};

const validatePolicy = (policy) => {
	if (!DATABASE_MODES.includes(policy?.database)) {
		throw new Error(`database tiene que ser uno de: ${DATABASE_MODES.join(", ")}`);
	}
	const connection = policy.databaseConnection ?? {};
	const urlVariable = typeof connection.urlVariable === "string" ? connection.urlVariable.trim() : "";
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(urlVariable)) throw new Error("databaseConnection.urlVariable no es un nombre de variable válido");

	return {
		database: policy.database,
		commandDenyPatterns: rules(policy.commandDenyPatterns, "commandDenyPatterns", { regex: true }),
		writeDenyPaths: rules(policy.writeDenyPaths, "writeDenyPaths", { regex: false }),
		databaseConnection: {
			envFiles: strings(connection.envFiles, "databaseConnection.envFiles"),
			urlVariable,
		},
	};
};

module.exports = { validatePolicy, DATABASE_MODES };
