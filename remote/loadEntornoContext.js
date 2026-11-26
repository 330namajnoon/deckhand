const path = require("path");
const execCommand = require("./execCommand");
const resolveRemotePath = require("./resolveRemotePath");
const sftp = require("./sftp");
const parseFrontmatter = require("./parseFrontmatter");
const findImports = require("./findImports");

const MAX_FILE_BYTES = 100 * 1024;
const MAX_TOTAL_BYTES = 200 * 1024;
const MAX_IMPORT_DEPTH = 4;
const MAX_INDEXED = 200;

// Carpetas que no se recorren buscando CLAUDE.md anidados.
const PRUNED_DIRS = ["node_modules", "vendor", ".git", "var", "dist", "build", ".cache", ".claude", ".next", "coverage"];

// Un solo exec para descubrir todo; cada línea es "categoría<TAB>ruta absoluta".
const DISCOVERY_SCRIPT = `
printf 'home\\t%s\\n' "$HOME"
[ -f "$HOME/.claude/CLAUDE.md" ] && printf 'user\\t%s\\n' "$HOME/.claude/CLAUDE.md"
d=$(dirname "$PWD")
while :; do
	for f in CLAUDE.md CLAUDE.local.md; do [ -f "$d/$f" ] && printf 'ancestor\\t%s\\n' "\${d%/}/$f"; done
	[ "$d" = / ] && break
	d=$(dirname "$d")
done
for f in CLAUDE.md .claude/CLAUDE.md CLAUDE.local.md; do [ -f "$f" ] && printf 'project\\t%s\\n' "$PWD/$f"; done
[ -f .claude/settings.json ] && printf 'settings\\t%s\\n' "$PWD/.claude/settings.json"
list() { find "$2" "\${@:3}" 2>/dev/null | sort | while IFS= read -r p; do printf '%s\\t%s\\n' "$1" "$PWD/\${p#./}"; done; }
[ -d .claude/rules ] && list rule .claude/rules -type f -name '*.md'
[ -d .claude/skills ] && list skill .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md
[ -d .claude/agents ] && list agent .claude/agents -type f -name '*.md'
[ -d .claude/commands ] && list command .claude/commands -type f -name '*.md'
list nested . -maxdepth 6 \\( ${PRUNED_DIRS.map((d) => `-name ${d}`).join(" -o ")} \\) -prune -o -type f -name CLAUDE.md ! -path ./CLAUDE.md -print
true
`;

const discover = async (deploy, root) => {
	const result = await execCommand(deploy, DISCOVERY_SCRIPT, { cwd: root, timeoutMs: 60 * 1000 });
	if (result.exitCode !== 0) throw new Error(`No se ha podido explorar ${root}: ${result.stderr || `exit ${result.exitCode}`}`);

	const found = { home: "/root", user: [], ancestor: [], project: [], settings: [], rule: [], skill: [], agent: [], command: [], nested: [] };
	for (const line of result.stdout.split("\n")) {
		const tab = line.indexOf("\t");
		if (tab === -1) continue;
		const [category, value] = [line.slice(0, tab), line.slice(tab + 1)];
		if (category === "home") found.home = value;
		else if (found[category]) found[category].push(value);
	}
	// De / hacia abajo, como los apila Claude Code.
	found.ancestor.sort((a, b) => a.split("/").length - b.split("/").length);
	return found;
};

const readText = async (deploy, file) => {
	const buffer = await sftp.readFile(deploy, file);
	const truncated = buffer.length > MAX_FILE_BYTES;
	const text = buffer.subarray(0, MAX_FILE_BYTES).toString("utf8");
	return truncated ? `${text}\n[... recortado a ${MAX_FILE_BYTES / 1024} KB: lee el resto con remote_read_file ...]` : text;
};

const resolveImport = (target, fromFile, home) => {
	if (target.startsWith("~/")) return path.posix.join(home, target.slice(2));
	return path.posix.resolve(path.posix.dirname(fromFile), target);
};

// Lee las instrucciones (CLAUDE.md y sus imports) hasta MAX_TOTAL_BYTES; el resto queda como "pendiente".
const readInstructions = async (deploy, found) => {
	const instructions = [];
	const pending = [];
	const seen = new Set();
	let total = 0;

	const visit = async (file, scope, importedFrom, depth) => {
		if (seen.has(file)) return;
		seen.add(file);
		if (total >= MAX_TOTAL_BYTES) return pending.push(file);

		let content;
		try {
			content = await readText(deploy, file);
		} catch {
			return; // Un import que apunta a un fichero que no existe: Claude Code también lo ignora.
		}
		total += Buffer.byteLength(content);
		instructions.push({ path: file, scope, importedFrom, content });

		if (depth >= MAX_IMPORT_DEPTH) return;
		for (const target of findImports(content)) {
			await visit(resolveImport(target, file, found.home), scope, file, depth + 1);
		}
	};

	for (const file of found.user) await visit(file, "usuario", null, 0);
	for (const file of found.ancestor) await visit(file, "carpeta superior", null, 0);
	for (const file of found.project) await visit(file, "proyecto", null, 0);

	return { instructions, pending };
};

const readRules = (deploy, files) =>
	Promise.all(
		files.slice(0, MAX_INDEXED).map(async (file) => {
			const content = await readText(deploy, file);
			const { paths } = parseFrontmatter(content);
			return { path: file, paths: Array.isArray(paths) ? paths : paths ? [paths] : [], content };
		})
	);

const readIndex = (deploy, files, nameOf) =>
	Promise.all(
		files.slice(0, MAX_INDEXED).map(async (file) => {
			const { name, description } = parseFrontmatter(await readText(deploy, file));
			return { name: name || nameOf(file), description: description || "", path: file };
		})
	);

// Lo que Claude Code cargaría al abrir una sesión en la raíz del proyecto del entorno.
const loadEntornoContext = async (deploy) => {
	const root = resolveRemotePath(deploy);
	const found = await discover(deploy, root);

	const [{ instructions, pending }, rules, skills, agents, commands, settings] = await Promise.all([
		readInstructions(deploy, found),
		readRules(deploy, found.rule),
		readIndex(deploy, found.skill, (file) => path.posix.basename(path.posix.dirname(file))),
		readIndex(deploy, found.agent, (file) => path.posix.basename(file, ".md")),
		readIndex(deploy, found.command, (file) => path.posix.basename(file, ".md")),
		found.settings.length ? readText(deploy, found.settings[0]) : null,
	]);

	return {
		root,
		instructions,
		pending,
		rules,
		nested: found.nested,
		skills,
		agents,
		commands,
		settings: settings && { path: found.settings[0], content: settings },
	};
};

module.exports = loadEntornoContext;
