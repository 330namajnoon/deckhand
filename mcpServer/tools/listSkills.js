const { listSkills } = require("../../utils");
const { jsonResult } = require("../toolResult");

module.exports = {
	name: "list_skills",
	title: "Listar skills disponibles",
	description:
		"Lista los skills de Claude Code disponibles en la carpeta skills/ de deckhand (name + description de cada uno). Úsalo para descubrir qué skills útiles para este proyecto existen antes de pedir el contenido completo de uno con get_skill.",
	inputSchema: {},
	handler: async () => jsonResult(listSkills()),
};
