const fs = require("fs/promises");
const path = require("path");

const DEPLOYS_FILE = path.join(__dirname, "..", "database", "deploys.json");

const saveDeploy = async (deployData) => {
	const deploys = JSON.parse(await fs.readFile(DEPLOYS_FILE, "utf8"));

	deploys.push(deployData);

	await fs.writeFile(DEPLOYS_FILE, JSON.stringify(deploys, null, 2));
};

module.exports = saveDeploy;
