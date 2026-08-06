const { createController } = require("sm-express-server");
const { openVscode } = require("../services");

const openVscodeController = createController(async (req, res) => {
	try {
		res.send(await openVscode(req.params.id));
	} catch (error) {
		if (error.status) {
			return res.status(error.status).send({ error: error.message });
		}
		throw error;
	}
});

module.exports = openVscodeController;
