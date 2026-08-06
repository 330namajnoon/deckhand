const { createController } = require("sm-express-server");
const { listDeploys } = require("../utils");

const getDeploysControllers = createController(async (req, res) => {
	const deploys = await listDeploys();

	res.send(deploys);
});

module.exports = getDeploysControllers;
