const path = require("path");
const DATA_DIR = require("../database/dataDir");

// Contiene el token de GitLab: permisos 600 y fuera del repo.
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

module.exports = CONFIG_FILE;
