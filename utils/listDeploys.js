const db = require("../database/client");
const { fromRow } = require("../database/deployRow");

const listDeploys = async ({ branchName, projectName, status, limit } = {}) => {
  const where = [];
  const params = [];

  if (branchName) {
    where.push("branchName LIKE ?");
    params.push(`%${branchName}%`);
  }
  if (projectName) {
    where.push("projectName LIKE ?");
    params.push(`%${projectName}%`);
  }
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    where.push(`status IN (${statuses.map(() => "?").join(", ")})`);
    params.push(...statuses);
  }

  let sql = "SELECT * FROM deploys";
  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += " ORDER BY createdAt DESC";
  if (limit) {
    sql += " LIMIT ?";
    params.push(limit);
  }

  return db.prepare(sql).all(...params).map(fromRow);
};

module.exports = listDeploys;
