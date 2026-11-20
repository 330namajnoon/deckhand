const db = require("../database/client");

const listRemoteActions = async ({ deployId, limit = 50 } = {}) => {
	const rows = deployId
		? db.prepare("SELECT * FROM remote_actions WHERE deployId = ? ORDER BY id DESC LIMIT ?").all(deployId, limit)
		: db.prepare("SELECT * FROM remote_actions ORDER BY id DESC LIMIT ?").all(limit);

	return rows.map((row) => ({ ...row, allowed: Boolean(row.allowed), input: JSON.parse(row.input) }));
};

module.exports = listRemoteActions;
