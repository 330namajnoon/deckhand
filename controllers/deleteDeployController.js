const { createController } = require("sm-express-server");
const { deleteDeploy } = require("../services");

const deleteDeployController = createController(async (req, res) => {
	try {
		res.send(await deleteDeploy(req.params.id));
	} catch (error) {
		if (error.status) {
			return res.status(error.status).send({ error: error.message });
		}
		throw error;
	}
});

module.exports = deleteDeployController;
