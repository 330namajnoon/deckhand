const listDeploys = require("./listDeploys");

const listActiveDeploys = ({ branchName, projectName, limit } = {}) =>
  listDeploys({ branchName, projectName, status: ["creando", "instalando"], limit });

module.exports = listActiveDeploys;
