const { createController } = require("sm-express-server");
const { listRepositoryTree } = require("../utils");

const getRepositoryTreeController = createController(async (req, res) => {
	const { ref, path = "", recursive } = req.query;

	if (!ref) {
		return res.status(400).send({ error: "Falta el parámetro ref" });
	}

	res.send(await listRepositoryTree(req.params.id, ref, path, recursive === "true"));
});

module.exports = getRepositoryTreeController;
