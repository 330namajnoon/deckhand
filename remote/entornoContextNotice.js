const resolveRemotePath = require("./resolveRemotePath");
const sftp = require("./sftp");

// Por proceso (con el plugin, una sesión de Claude Code): qué deploys ya cargaron su contexto o ya recibieron el aviso.
const loaded = new Set();
const notified = new Set();

const keyOf = (deploy) => `${deploy.id}|${deploy.servidorSsh}|${deploy.puertoSsh}`;

const CONTEXT_PATHS = ["CLAUDE.md", ".claude", "CLAUDE.local.md"];

const markContextLoaded = (deploy) => loaded.add(keyOf(deploy));

// Texto del aviso la primera vez que se toca un entorno con instrucciones propias sin haberlas cargado; si no, null.
const contextNoticeFor = async (deploy) => {
	const key = keyOf(deploy);
	if (loaded.has(key) || notified.has(key)) return null;
	notified.add(key);

	const present = await Promise.all(CONTEXT_PATHS.map((p) => sftp.exists(deploy, resolveRemotePath(deploy, p)).catch(() => false)));
	const found = CONTEXT_PATHS.filter((_, i) => present[i]);
	if (!found.length) return null;

	return `⚠️ Este entorno tiene instrucciones propias (${found.join(", ")}) que todavía no has cargado. Antes de seguir trabajando en él, llama a remote_load_context con deployId "${deploy.id}" y aplícalas como si la sesión estuviera abierta allí.`;
};

module.exports = { markContextLoaded, contextNoticeFor };
