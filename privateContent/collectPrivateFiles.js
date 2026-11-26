const fs = require("fs");
const path = require("path");
const { PLUGIN_ROOT, CONTENT_DIRS, PUBLIC_FILES } = require("./paths");

const walk = (relDir) => {
	const absDir = path.join(PLUGIN_ROOT, relDir);
	if (!fs.existsSync(absDir)) return [];

	return fs.readdirSync(absDir, { withFileTypes: true }).flatMap((entry) => {
		const rel = `${relDir}/${entry.name}`;
		if (entry.isDirectory()) return walk(rel);
		return entry.isFile() && entry.name !== ".DS_Store" ? [rel] : [];
	});
};

// Lo que hay en claro en skills/, agents/ y commands/ salvo los ficheros públicos: es lo que se cifra.
const collectPrivateFiles = () =>
	CONTENT_DIRS.flatMap(walk)
		.filter((rel) => !PUBLIC_FILES.includes(rel))
		.sort();

module.exports = collectPrivateFiles;
