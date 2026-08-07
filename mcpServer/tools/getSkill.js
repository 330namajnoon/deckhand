const { z } = require("zod");
const { getSkill } = require("../../utils");
const { resourceResult } = require("../toolResult");

module.exports = {
	name: "get_skill",
	title: "Obtener un skill",
	description:
		"Devuelve un skill de deckhand por su nombre como un archivo .zip (carpeta skills/<name>/ completa: SKILL.md más cualquier script/referencia/asset que traiga), tal y como lo devuelve list_skills. Pensado para instalarlo directamente como skill de Claude Code descomprimiendo el .zip en .claude/skills/.",
	inputSchema: {
		name: z.string().describe("Nombre del skill (el de su carpeta dentro de skills/), tal y como lo devuelve list_skills"),
	},
	handler: async ({ name }) => {
		const { zip } = getSkill(name);
		return resourceResult(`skill://${name}.zip`, "application/zip", zip);
	},
};
