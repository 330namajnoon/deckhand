const fs = require("fs");
const CONFIG_FILE = require("./configFile");

// Se lee en cada llamada para que los cambios del panel se apliquen sin reiniciar.
const readSettings = () => {
	try {
		return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
	} catch (error) {
		if (error.code === "ENOENT") return {};
		throw new Error(`No se ha podido leer ${CONFIG_FILE}: ${error.message}`);
	}
};

module.exports = readSettings;
