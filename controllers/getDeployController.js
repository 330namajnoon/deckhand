const { createController } = require("sm-express-server");
const fs = require("fs/promises");
const path = require("path");

const DEPLOYS_FILE = path.join(__dirname, "..", "database", "deploys.json");

const getDeployController = createController(async (req, res) => {
	const { id } = req.params;

	const deploys = JSON.parse(await fs.readFile(DEPLOYS_FILE, "utf8"));

	const deploy = deploys.find((d) => d.id === id);

	if (!deploy) {
		return res.status(404).send({ error: `No existe ningún deploy con id ${id}` });
	}

	res.send(deploy);
});

module.exports = getDeployController;
