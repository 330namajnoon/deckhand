// Claude Code arranca el plugin con el node del PATH, que puede ser antiguo; el bundle necesita Node >= 22.13 (node:sqlite).
// Debe funcionar con cualquier Node, sin dependencias y escribiendo solo en stderr: stdout es el canal MCP.
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const MIN_VERSION = [22, 13, 0];
const SERVER = path.join(__dirname, "..", "bundle", "server.js");

const parseVersion = (text) => {
	const match = /v?(\d+)\.(\d+)\.(\d+)/.exec(String(text));
	return match ? match.slice(1, 4).map(Number) : null;
};

const compareVersions = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const isSupported = (version) => version !== null && compareVersions(version, MIN_VERSION) >= 0;

const versionOf = (nodePath) => {
	try {
		return parseVersion(execFileSync(nodePath, ["-v"], { encoding: "utf8", timeout: 5000 }));
	} catch (error) {
		return null;
	}
};

const listDir = (dir) => {
	try {
		return fs.readdirSync(dir);
	} catch (error) {
		return [];
	}
};

const nodeBinary = process.platform === "win32" ? "node.exe" : "node";

// DECKHAND_NODE permite fijar el Node a mano.
const candidates = () => {
	const found = [];
	if (process.env.DECKHAND_NODE) found.push(process.env.DECKHAND_NODE);

	for (const dir of (process.env.PATH || "").split(path.delimiter)) {
		if (dir) found.push(path.join(dir, nodeBinary));
	}

	const home = os.homedir();
	const isWindows = process.platform === "win32";
	// En Windows el ejecutable va en la raíz de cada versión, no en bin/.
	const bin = isWindows ? "" : "bin";
	const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
	const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
	const xdgData = process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
	const versionDirs = [
		[path.join(process.env.NVM_DIR || path.join(home, ".nvm"), "versions", "node"), "bin"],
		[process.env.NVM_HOME || (isWindows ? path.join(appData, "nvm") : ""), ""],
		[path.join(process.env.VOLTA_HOME || (isWindows ? path.join(localAppData, "Volta") : path.join(home, ".volta")), "tools", "image", "node"), bin],
		[process.env.FNM_DIR ? path.join(process.env.FNM_DIR, "node-versions") : "", path.join("installation", bin)],
		[path.join(home, "Library", "Application Support", "fnm", "node-versions"), path.join("installation", "bin")],
		[path.join(xdgData, "fnm", "node-versions"), path.join("installation", "bin")],
		[path.join(home, ".fnm", "node-versions"), path.join("installation", "bin")],
		[path.join(appData, "fnm", "node-versions"), path.join("installation", "")],
		[path.join(process.env.ASDF_DATA_DIR || path.join(home, ".asdf"), "installs", "nodejs"), "bin"],
	];
	for (const [root, binDir] of versionDirs) {
		if (!root) continue;
		for (const version of listDir(root)) found.push(path.join(root, version, binDir, nodeBinary));
	}

	if (isWindows) {
		found.push(path.join(process.env.ProgramFiles || "C:\\Program Files", "nodejs", nodeBinary));
	} else {
		found.push("/opt/homebrew/bin/node", "/usr/local/bin/node", "/usr/bin/node");
	}
	return [...new Set(found)].filter((candidate) => fs.existsSync(candidate));
};

const findNode = () => {
	let best = null;
	for (const candidate of candidates()) {
		const version = versionOf(candidate);
		if (isSupported(version) && (!best || compareVersions(version, best.version) > 0)) {
			best = { path: candidate, version };
		}
	}
	return best;
};

const start = () => {
	if (isSupported(parseVersion(process.version))) {
		require(SERVER);
		return;
	}

	const node = findNode();
	if (!node) {
		process.stderr.write(
			`deckhand necesita Node >= ${MIN_VERSION.join(".")} (usa node:sqlite) y Claude Code lo ha arrancado con ${process.version}. ` +
				"No se ha encontrado ninguno válido en el PATH, nvm, Volta, fnm, asdf ni en las rutas de instalación habituales: instala uno o indica su ruta en la variable DECKHAND_NODE.\n",
		);
		process.exit(1);
	}

	process.stderr.write(`deckhand: ${process.version} no vale, arrancando con ${node.path} (v${node.version.join(".")})\n`);
	const child = spawn(node.path, [SERVER], { stdio: "inherit", env: process.env });

	const forwardedSignals = ["SIGINT", "SIGTERM", "SIGHUP"];
	for (const signal of forwardedSignals) {
		process.on(signal, () => child.kill(signal));
	}
	child.on("error", (error) => {
		process.stderr.write(`deckhand: no se ha podido arrancar ${node.path}: ${error.message}\n`);
		process.exit(1);
	});
	child.on("exit", (code, signal) => {
		if (signal) {
			// Sin los handlers, para que la señal termine este proceso en vez de reenviarse al hijo.
			for (const forwarded of forwardedSignals) process.removeAllListeners(forwarded);
			process.kill(process.pid, signal);
			return;
		}
		process.exit(code === null ? 1 : code);
	});
};

start();
