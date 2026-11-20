const fs = require("fs");
const path = require("path");
const readSkillFile = require("./readSkillFile");

const SKILLS_DIR = path.join(__dirname, "..", "skills");

const listSkills = () => {
	if (!fs.existsSync(SKILLS_DIR)) return [];

	return fs
		.readdirSync(SKILLS_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => readSkillFile(entry.name))
		.filter(Boolean)
		.map(({ name, description }) => ({ name, description }));
};

module.exports = listSkills;
