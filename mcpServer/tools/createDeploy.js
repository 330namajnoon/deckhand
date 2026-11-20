const { z } = require("zod");
const { createDeploy } = require("../../services");
const { textResult } = require("../toolResult");

// "move" lleva previousPath; sin content, GitLab conserva el original.
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
		"Crea un entorno de deploy (o reutiliza uno ya activo para el mismo repo/rama/tipo). Se ejecuta en segundo plano: sondear get_deploy con el id devuelto (~cada 5s) hasta que el status sea 'listo' o 'error'. Para entornos de tipo 'entorno' (no 'test'), el login SSH inicial, la copia de la clave SSH y la apertura de VS Code NO los hace deckhand: cuando el status sea 'listo', usar el tool open_vscode con este mismo id para obtener los datos e instrucciones y hacerlo en tu propia máquina.",
	inputSchema: {
		branchName: z
			.string()
			.describe(
				"Nombre de la tarea (ej. 'TASK-123'), no el nombre final de la rama: deckhand genera la rama del entorno a partir de este valor (tipo + tarea + repo, todo en minúsculas sin separadores, ej. 'entornostore2080storeapies'). No hay que inventar sufijos ni adivinar la convención: se deriva sola, incluso si ya se llamó antes con la misma tarea+repo (se reutiliza la rama existente)."
			),
		projectId: z.union([z.string(), z.number()]).describe("Id del repositorio en GitLab a desplegar. Usa list_repositories o get_repo_catalog para resolverlo por nombre/país/rol."),
		projectName: z
			.string()
			.optional()
			.describe("Opcional: si no se manda, deckhand lo resuelve solo a partir de projectId."),
		ref: z.string().optional().describe("Rama/commit base sobre la que crear la rama del entorno"),
		type: z
			.enum(["entorno", "test"])
			.default("entorno")
			.describe(
				"'entorno' (por defecto): entorno completo con instalación SSH, requiere open_vscode al terminar. 'test': solo despliega la rama (sin instalación SSH/VS Code), usado en los store-frontend-v2-* para entornos de test que cargan su configuración desde envs/<rama>."
			),
		entornoUrl: z
			.string()
			.optional()
			.describe(
				"URL de OTRO entorno (normalmente el de la API) a la que este backend/frontend debe apuntar. Úsalo cuando el par API+backend (o backend+frontend) están encadenados: crea primero el entorno de la API, espera a que su status sea 'listo', y pasa su url aquí al crear el del backend. Solo tiene efecto en los proyectos que lo soportan (store-backend-*, store-frontend-v2-* de tipo test); en el resto se ignora."
			),
		messenger: z
			.boolean()
			.default(false)
			.describe(
				"Si es true, habilita el messenger (supervisor + transports) en el entorno. Solo tiene efecto en store-api-*; en el resto se ignora."
			),
		editActions: z
			.array(editActionSchema)
			.default([])
			.describe(
				"Cambios de fichero adicionales (create/update/delete/move) que se aplican en el primer commit de la rama del entorno, junto con los que deckhand genera automáticamente (sync de entornoUrl, messenger, etc). Normalmente se deja vacío; solo hace falta si además hay que tocar ficheros a mano. el formato es = EditAction = | { action: 'update' | 'create'; filePath: string; content: string } | { action: 'delete'; filePath: string } | { action: 'move'; filePath: string; previousPath: string; content?: string };"
			),
	},
	handler: async (input) => {
		const { deploy, isNew } = await createDeploy({ ...input, remoteInstall: false });

		const note = isNew
			? `Deploy encolado con id ${deploy.id}, status "${deploy.status}". Sondear get_deploy con este id (~cada 5s) hasta que el status sea "listo" o "error". Si el tipo es "entorno", cuando esté "listo" hay que llamar a open_vscode con este id para terminar la instalación en tu máquina y abrir VS Code.`
			: `Ya existe un deploy activo para este repo/rama/tipo (id ${deploy.id}, status "${deploy.status}"); se devuelve ese en vez de crear uno nuevo.`;

		return textResult(`${note}\n\n${JSON.stringify(deploy, null, 2)}`);
	},
};
