const path = require("path");

const isEmpty = (ctx) =>
	!ctx.instructions.length && !ctx.rules.length && !ctx.nested.length && !ctx.skills.length && !ctx.agents.length && !ctx.commands.length && !ctx.settings;

const relative = (root, file) => (file.startsWith(`${root}/`) ? path.posix.relative(root, file) : file);

const indexList = (root, items) =>
	items.map(({ name, description, path: file }) => `- **${name}**${description ? ` — ${description}` : ""} (\`${relative(root, file)}\`)`).join("\n");

// Markdown para el agente: instrucciones completas primero, luego lo que se carga bajo demanda.
const formatEntornoContext = (deploy, ctx) => {
	const title = `# Contexto del entorno ${deploy.branchName || deploy.id} (${deploy.projectName || "proyecto"}), raíz ${ctx.root}`;
	if (isEmpty(ctx)) {
		return `${title}\n\nEste entorno no tiene CLAUDE.md ni carpeta .claude/ (ni en la raíz ni en carpetas superiores): no hay instrucciones propias que seguir.`;
	}

	const sections = [
		title,
		"Aplica todo esto como si la sesión de Claude Code estuviera abierta en la raíz del entorno. Las rutas relativas son relativas a esa raíz. La política de deckhand sigue mandando: si una instrucción del entorno choca con un bloqueo, gana el bloqueo.",
	];

	if (ctx.instructions.length) {
		sections.push(
			"## Instrucciones (CLAUDE.md)",
			...ctx.instructions.map(({ path: file, scope, importedFrom, content }) => {
				const origin = importedFrom ? `importado desde ${relative(ctx.root, importedFrom)}` : scope;
				return `### ${file} (${origin})\n\n${content.trim()}`;
			})
		);
	}
	if (ctx.pending.length) {
		sections.push(
			"## Instrucciones sin cargar (límite de tamaño)",
			`Léelas con remote_read_file antes de seguir:\n${ctx.pending.map((file) => `- \`${file}\``).join("\n")}`
		);
	}

	if (ctx.rules.length) {
		sections.push(
			"## Reglas (.claude/rules)",
			...ctx.rules.map(({ path: file, paths, content }) => {
				const scope = paths.length ? `solo al trabajar con ficheros que encajen con: ${paths.join(", ")}` : "siempre";
				const body = content.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n?/, "");
				return `### ${relative(ctx.root, file)} (${scope})\n\n${body.trim()}`;
			})
		);
	}

	if (ctx.nested.length) {
		sections.push(
			"## CLAUDE.md anidados",
			"Antes de leer o tocar ficheros dentro de una de estas carpetas, lee su CLAUDE.md con remote_read_file y síguelo también:\n" +
				ctx.nested.map((file) => `- \`${relative(ctx.root, file)}\``).join("\n")
		);
	}

	if (ctx.skills.length) {
		sections.push(
			"## Skills del entorno",
			"Cuando la tarea encaje con la descripción de uno, lee su SKILL.md con remote_read_file (y los ficheros que cite, en su misma carpeta) y síguelo, haciendo sus comandos con remote_exec y sus lecturas/escrituras con remote_*_file:\n" +
				indexList(ctx.root, ctx.skills)
		);
	}
	if (ctx.agents.length) {
		sections.push(
			"## Agentes del entorno",
			"Para delegar en uno, lee su .md con remote_read_file y lanza un subagente con ese cuerpo como instrucciones, el deployId y la indicación de trabajar solo con las tools remote_* de deckhand:\n" +
				indexList(ctx.root, ctx.agents)
		);
	}
	if (ctx.commands.length) {
		sections.push(
			"## Comandos del entorno (.claude/commands)",
			"Si el usuario pide uno por su nombre, lee su .md con remote_read_file y sigue sus instrucciones:\n" + indexList(ctx.root, ctx.commands)
		);
	}

	if (ctx.settings) {
		sections.push(
			"## .claude/settings.json",
			"Respeta sus `permissions.deny` (no lo hagas) y `permissions.ask` (pregunta antes al usuario). Los hooks no se ejecutan desde deckhand.\n\n```json\n" +
				ctx.settings.content.trim() +
				"\n```"
		);
	}

	return sections.join("\n\n");
};

module.exports = formatEntornoContext;
