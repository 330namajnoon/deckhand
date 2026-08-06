const { createController } = require("sm-express-server");
const { listBranches } = require("../utils");

const getBranchesController = createController(async (req, res) => {
	res.send(await listBranches(req.params.id));
});

module.exports = getBranchesController;
