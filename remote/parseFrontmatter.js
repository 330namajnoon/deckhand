// Frontmatter mínimo de los .md de Claude Code: `clave: valor`, bloques `>`/`|` y listas `- item` (p. ej. paths de las rules).
const unquote = (value) => value.replace(/^(['"])(.*)\1$/, "$2");

const parseFrontmatter = (raw) => {
	const match = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
	if (!match) return {};

	const fields = {};
	let currentKey = null;
	let mode = null;

	for (const line of match[1].split("\n")) {
		const keyMatch = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (keyMatch) {
			currentKey = keyMatch[1];
			const value = keyMatch[2].trim();
			if (/^[>|][-+]?$/.test(value)) {
				mode = "block";
				fields[currentKey] = "";
			} else if (value === "") {
				mode = "list";
				fields[currentKey] = [];
			} else {
				mode = null;
				fields[currentKey] = unquote(value);
			}
			continue;
		}
		if (!currentKey || !line.trim()) continue;

		if (mode === "list" && /^\s*-\s+/.test(line)) {
			fields[currentKey].push(unquote(line.replace(/^\s*-\s+/, "").trim()));
		} else if (mode === "block") {
			fields[currentKey] = `${fields[currentKey]} ${line.trim()}`.trim();
		}
	}

	return fields;
};

module.exports = parseFrontmatter;
