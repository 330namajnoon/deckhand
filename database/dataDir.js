const fs = require("fs");
const os = require("os");
const path = require("path");

// Fuera del repo para sobrevivir a reinstalaciones del plugin; compartida entre servidor web y MCP.
const DATA_DIR = process.env.DECKHAND_HOME || path.join(os.homedir(), ".deckhand");

fs.mkdirSync(DATA_DIR, { recursive: true });

module.exports = DATA_DIR;
