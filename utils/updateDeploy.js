const fs = require("fs/promises");
const path = require("path");

const DEPLOYS_FILE = path.join(__dirname, "..", "database", "deploys.json");

const updateDeploy = async (id, changes) => {
	const deploys = JSON.parse(await fs.readFile(DEPLOYS_FILE, "utf8"));

	const index = deploys.findIndex((deploy) => deploy.id === id);
	if (index === -1) throw new Error(`No existe ningún deploy con id ${id}`);

	deploys[index] = { ...deploys[index], ...changes };

	await fs.writeFile(DEPLOYS_FILE, JSON.stringify(deploys, null, 2));

	return deploys[index];
};

module.exports = updateDeploy;
