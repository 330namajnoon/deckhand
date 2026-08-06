const { createController } = require("sm-express-server");
const { getRepositoryFile } = require("../utils");

const getRepositoryFileController = createController(async (req, res) => {
	const { ref, path } = req.query;

	if (!ref || !path) {
		return res.status(400).send({ error: "Faltan los parámetros ref y/o path" });
	}

	res.send(await getRepositoryFile(req.params.id, ref, path));
});

module.exports = getRepositoryFileController;
