const fs = require("fs");
const CONFIG_FILE = require("./configFile");
const SETTINGS = require("./definitions");
const readSettings = require("./readSettings");

// Un sensible vacío significa "sin cambios"; para borrarlo se manda en `clear`.
const saveSettings = (values, clear = []) => {
	const current = readSettings();
	const next = { ...current };

	for (const { key, sensitive } of SETTINGS) {
		if (clear.includes(key)) {
			delete next[key];
			continue;
		}
		if (typeof values[key] !== "string") continue;

		const value = values[key].trim();
		if (sensitive && value === "") continue;
		if (value === "") delete next[key];
		else next[key] = value;
	}

	const tmp = `${CONFIG_FILE}.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
	fs.renameSync(tmp, CONFIG_FILE);
	fs.chmodSync(CONFIG_FILE, 0o600);
};

module.exports = saveSettings;
