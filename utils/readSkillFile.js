const fs = require("fs");
const path = require("path");

const SKILLS_DIR = path.join(__dirname, "..", "skills");

// Frontmatter mínimo (name/description como pares "clave: valor" planos),
// suficiente para SKILL.md sin añadir una dependencia de YAML al proyecto.
const parseFrontmatter = (raw) => {
	const match = raw.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return {};

	const fields = {};
	match[1].split("\n").forEach((line) => {
		const idx = line.indexOf(":");
		if (idx === -1) return;
		fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
	});

	return fields;
};

// Lee skills/<skillName>/SKILL.md; null si no existe (carpeta inexistente o sin SKILL.md).
const readSkillFile = (skillName) => {
	const filePath = path.join(SKILLS_DIR, skillName, "SKILL.md");
	if (!fs.existsSync(filePath)) return null;

	const content = fs.readFileSync(filePath, "utf8");
	const { name, description } = parseFrontmatter(content);

	return { name: name || skillName, description: description || "", content };
};

module.exports = readSkillFile;
