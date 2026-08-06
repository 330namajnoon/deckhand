const { createController } = require("sm-express-server");
const { getDeploy } = require("../utils");

const getDeployController = createController(async (req, res) => {
	const { id } = req.params;

	const deploy = await getDeploy(id);

	if (!deploy) {
		return res.status(404).send({ error: `No existe ningún deploy con id ${id}` });
	}

	res.send(deploy);
});

module.exports = getDeployController;
