const { createController } = require("sm-express-server");
const { redeployEntorno } = require("../services");

const redeployEntornoController = createController(async (req, res) => {
	try {
		res.status(202).send(await redeployEntorno(req.params.id));
	} catch (error) {
		if (error.status) {
			return res.status(error.status).send({ error: error.message });
		}
		throw error;
	}
});

module.exports = redeployEntornoController;
