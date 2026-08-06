const { createController } = require("sm-express-server");
const { createDeploy } = require("../services");

const deployEntornoController = createController(async (req, res) => {
	try {
		const { deploy, isNew } = await createDeploy(req.body);
		res.status(isNew ? 202 : 200).send(deploy);
	} catch (error) {
		if (error.status) {
			return res.status(error.status).send({ error: error.message });
		}
		throw error;
	}
});

module.exports = deployEntornoController;
