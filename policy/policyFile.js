const path = require("path");
const DATA_DIR = require("../database/dataDir");

const POLICY_FILE = path.join(DATA_DIR, "policy.json");

module.exports = POLICY_FILE;
