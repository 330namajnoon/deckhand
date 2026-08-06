const deleteDeployController = require("./deleteDeployController");
const deployEntornoController = require("./deployEntornoController");
const redeployEntornoController = require("./redeployEntornoController");
const getDeploysControllers = require("./getDeploysControllers");
const getDeployController = require("./getDeployController");
const getRepositoriesController = require("./getRepositoriesController");
const getBranchesController = require("./getBranchesController");
const getRepositoryTreeController = require("./getRepositoryTreeController");
const getRepositoryFileController = require("./getRepositoryFileController");
const openVscodeController = require("./openVscodeController");

module.exports = {
	getDeploysControllers,
	getDeployController,
	getRepositoriesController,
	getBranchesController,
	getRepositoryTreeController,
	getRepositoryFileController,
	deleteDeployController,
	deployEntornoController,
	redeployEntornoController,
	openVscodeController,
};
