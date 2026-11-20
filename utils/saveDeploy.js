const db = require("../database/client");
const { toRow } = require("../database/deployRow");

const saveDeploy = async (deployData) => {
	const row = toRow(deployData);
	const columns = Object.keys(row);
	db.prepare(`INSERT INTO deploys (${columns.join(", ")}) VALUES (${columns.map((c) => `:${c}`).join(", ")})`).run(row);
};

module.exports = saveDeploy;
