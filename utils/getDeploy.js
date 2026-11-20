const db = require("../database/client");
const { fromRow } = require("../database/deployRow");

const getDeploy = async (id) => fromRow(db.prepare("SELECT * FROM deploys WHERE id = ?").get(id));

module.exports = getDeploy;
