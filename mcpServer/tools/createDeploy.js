const { z } = require("zod");
const { createDeploy } = require("../../services");
const { textResult } = require("../toolResult");

// Acciones de commit de GitLab aplicadas en el primer commit de la rama del
// entorno (mismo formato que EditAction en public/src/types.ts). "move" son
// los renombrados/duplicados de carpetas y ficheros: llevan previousPath y
// el content es opcional (si no se manda, GitLab conserva el original).
const editActionSchema = z.object({
	action: z.enum(["create", "update", "delete", "move"]),
	filePath: z.string(),
	content: z.string().optional(),
	previousPath: z.string().optional(),
});

module.exports = {
	name: "create_deploy",
	title: "Crear un deploy",
	description:
		"Crea un entorno de deploy (o reutiliza uno ya activo para el mismo repo/rama/tipo). Se ejecuta en segundo plano: sondear get_deploy con el id devuelto (~cada 5s) hasta que el status sea 'listo' o 'error'.",
	inputSchema: {
		branchName: z.string(),
		projectId: z.union([z.string(), z.number()]).describe("Id del repositorio en GitLab a desplegar"),
		projectName: z.string().optional(),
		ref: z.string().optional().describe("Rama/commit base sobre la que crear la rama del entorno"),
		type: z.enum(["entorno", "test"]).default("entorno"),
		entornoUrl: z.string().optional(),
		messenger: z.boolean().default(false),
		editActions: z.array(editActionSchema).default([]),
	},
	handler: async (input) => {
		const { deploy, isNew } = await createDeploy(input);

		const note = isNew
			? `Deploy encolado con id ${deploy.id}, status "${deploy.status}". Sondear get_deploy con este id (~cada 5s) hasta que el status sea "listo" o "error".`
			: `Ya existe un deploy activo para este repo/rama/tipo (id ${deploy.id}, status "${deploy.status}"); se devuelve ese en vez de crear uno nuevo.`;

		return textResult(`${note}\n\n${JSON.stringify(deploy, null, 2)}`);
	},
};
