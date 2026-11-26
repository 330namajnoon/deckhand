const path = require("path");

// Un nivel por debajo de la raíz tanto en el código fuente (privateContent/) como en el bundle (bundle/server.js).
const PLUGIN_ROOT = path.join(__dirname, "..");

// Versionado: lo único que se publica de los skills/agentes privados.
const ENCRYPTED_FILE = path.join(PLUGIN_ROOT, "private.enc");

// Qué se descifró y de qué private.enc (su hash), para no repetirlo en cada arranque. Gitignored.
const MARKER_FILE = path.join(PLUGIN_ROOT, ".private-unlocked.json");

// Carpetas que Claude Code carga de un plugin; el contenido privado se descifra dentro de ellas.
const CONTENT_DIRS = ["skills", "agents", "commands"];

// Ficheros públicos (versionados en claro) dentro de esas carpetas: ni se cifran ni se sobrescriben.
const PUBLIC_FILES = ["skills/README.md", "commands/settings.md"];

const PASSWORD_SETTING = "PRIVATE_CONTENT_PASSWORD";

module.exports = { PLUGIN_ROOT, ENCRYPTED_FILE, MARKER_FILE, CONTENT_DIRS, PUBLIC_FILES, PASSWORD_SETTING };
