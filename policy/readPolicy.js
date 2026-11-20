const fs = require("fs");
const POLICY_FILE = require("./policyFile");
const { DEFAULT_POLICY } = require("./defaults");
const { validatePolicy } = require("./validatePolicy");

// Una política rota lanza en vez de caer a los valores por defecto: no debe volverse más permisiva sin avisar.
const readPolicy = () => {
	let saved;
	try {
		saved = JSON.parse(fs.readFileSync(POLICY_FILE, "utf8"));
	} catch (error) {
		if (error.code === "ENOENT") return DEFAULT_POLICY;
		throw new Error(`No se ha podido leer ${POLICY_FILE}: ${error.message}`);
	}

	try {
		return validatePolicy({ ...DEFAULT_POLICY, ...saved });
	} catch (error) {
		throw new Error(`La política de ${POLICY_FILE} no es válida: ${error.message}`);
	}
};

module.exports = readPolicy;
