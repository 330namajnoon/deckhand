const path = require("path");
const AdmZip = require("adm-zip");
const HttpError = require("./HttpError");
const readSkillFile = require("./readSkillFile");

const SKILLS_DIR = path.join(__dirname, "..", "skills");

// Empaqueta skills/<name>/ entera en un .zip (no solo SKILL.md: una skill puede
// traer scripts/referencias/assets junto al SKILL.md) con el propio <name> como
// carpeta raíz del zip, para poder descomprimirla directamente como .claude/skills/<name>/.
const getSkill = (name) => {
	const skill = readSkillFile(name);
	if (!skill) throw new HttpError(`Skill "${name}" no encontrado`, 404);

	const zip = new AdmZip();
	zip.addLocalFolder(path.join(SKILLS_DIR, name), name);

	return { name: skill.name, description: skill.description, zip: zip.toBuffer() };
};

module.exports = getSkill;
