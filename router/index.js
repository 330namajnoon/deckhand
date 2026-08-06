const { createRouter } = require("sm-express-server");
const controllers = require("../controllers");
const withErrorLogging = require("./withErrorLogging");

module.exports = createRouter("/", (router) => {
	router.get("/repositories", withErrorLogging(controllers.getRepositoriesController));

	router.get("/repositories/:id/branches", withErrorLogging(controllers.getBranchesController));

	router.get("/repositories/:id/tree", withErrorLogging(controllers.getRepositoryTreeController));

	router.get("/repositories/:id/file", withErrorLogging(controllers.getRepositoryFileController));

	router.get("/deploys", withErrorLogging(controllers.getDeploysControllers));

	router.get("/deploys/:id", withErrorLogging(controllers.getDeployController));

	router.delete("/deploys/:id", withErrorLogging(controllers.deleteDeployController));

	router.post("/deploys/:id/open-vscode", withErrorLogging(controllers.openVscodeController));

	router.post("/deploys/:id/redeploy", withErrorLogging(controllers.redeployEntornoController));

	router.post("/deploy", withErrorLogging(controllers.deployEntornoController));
});
