const prisma = require("../database/client");

// Deploys en curso (ni terminados ni fallidos): status "creando" o
// "instalando". Mismos filtros opcionales que listDeploys.js.
const listActiveDeploys = ({ branchName, projectName, limit } = {}) =>
  prisma.deploy.findMany({
    where: {
      status: { in: ["creando", "instalando"] },
      ...(branchName && { branchName: { contains: branchName } }),
      ...(projectName && { projectName: { contains: projectName } }),
    },
    orderBy: { createdAt: "desc" },
    ...(limit && { take: limit }),
  });

module.exports = listActiveDeploys;
