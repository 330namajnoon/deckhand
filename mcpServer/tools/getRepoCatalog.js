const { getRepoCatalog } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "get_repo_catalog",
	title: "Catálogo de repositorios",
	description:
		"Lista los repositorios de GitLab con su país (es/pt) y rol (api/backend/frontend) cuando siguen la convención de nombres store-<rol>-<pais>. Úsalo para resolver el projectId correcto de create_deploy por país/rol en vez de adivinarlo o buscarlo a mano en list_repositories — evita confundir un -es con un -pt. pais/rol vienen null en repos que no siguen esa convención.",
	inputSchema: {},
	handler: async () => jsonResult(await getRepoCatalog()),
};
