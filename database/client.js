const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const DATA_DIR = require("./dataDir");
const migrate = require("./migrate");

const db = new DatabaseSync(path.join(DATA_DIR, "deckhand.db"));

// WAL: lecturas concurrentes mientras otro proceso escribe (servidor + MCP).
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA busy_timeout = 5000");

migrate(db);

module.exports = db;
