const { createController } = require("sm-express-server");
const fs = require("fs/promises");
const path = require("path");

const DEPLOYS_FILE = path.join(__dirname, "..", "database", "deploys.json");

const getDeploysControllers = createController(async (req, res) => {
	const data = await fs.readFile(DEPLOYS_FILE, "utf8");
	const deploys = JSON.parse(data);

	// Más reciente primero.
	deploys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

	res.send(deploys);
});

module.exports = getDeploysControllers;
