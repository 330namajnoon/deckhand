const { z } = require("zod");
const { deleteDeploy } = require("../../services");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "delete_deploy",
	title: "Borrar un deploy",
	description: "Borra un deploy: elimina su rama en GitLab (si existe) y lo quita del listado.",
	inputSchema: {
		deployId: z.string(),
	},
	handler: async ({ deployId }) => jsonResult(await deleteDeploy(deployId)),
};
