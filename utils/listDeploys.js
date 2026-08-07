const prisma = require("../database/client");

// Más reciente primero. Los filtros son opcionales (compatibilidad con los
// callers que listan todo sin acotar); branchName/projectName hacen match
// parcial, status es exacto, limit acota el número de resultados.
const listDeploys = ({ branchName, projectName, status, limit } = {}) =>
  prisma.deploy.findMany({
    where: {
      ...(branchName && { branchName: { contains: branchName } }),
      ...(projectName && { projectName: { contains: projectName } }),
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
    ...(limit && { take: limit }),
  });

module.exports = listDeploys;
