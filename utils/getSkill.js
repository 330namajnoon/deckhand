const path = require("path");
const AdmZip = require("adm-zip");
const HttpError = require("./HttpError");
const readSkillFile = require("./readSkillFile");

const SKILLS_DIR = path.join(__dirname, "..", "skills");

// La carpeta entera (scripts, referencias...) con <name> como raíz, lista para descomprimir en .claude/skills/.
const getSkill = (name) => {
	const skill = readSkillFile(name);
	if (!skill) throw new HttpError(`Skill "${name}" no encontrado`, 404);

	const zip = new AdmZip();
	zip.addLocalFolder(path.join(SKILLS_DIR, name), name);

	return { name: skill.name, description: skill.description, zip: zip.toBuffer() };
};

module.exports = getSkill;
