const db = require("../database/client");
const { fromRow } = require("../database/deployRow");

async function findActiveDeploy(projectId, branchName, type) {
  const row = db
    .prepare(
      `SELECT * FROM deploys
       WHERE status IN ('creando', 'instalando') AND branchName = ? AND type IS ? AND projectId = ?
       LIMIT 1`
    )
    .get(branchName, type ?? null, Number(projectId));
  return fromRow(row);
}

module.exports = findActiveDeploy;
