const prisma = require("../database/client");

/**
 * Busca, entre los deploys guardados, uno en curso (estado "creando" o
 * "instalando", es decir ni terminado ni fallido) para el mismo repositorio,
 * misma tarea y mismo tipo de entorno. Se usa para no lanzar un deploy
 * duplicado cuando la rama del entorno ya se está creando/desplegando.
 *
 * @param {number|string} projectId - Id del repositorio.
 * @param {string} branchName - Nombre de la tarea (ej. "STORE-2080").
 * @param {'entorno'|'test'} type - Tipo de entorno.
 * @returns {Promise<object|null>} El deploy en curso, si lo hay.
 */
async function findActiveDeploy(projectId, branchName, type) {
  return prisma.deploy.findFirst({
    where: {
      status: { in: ["creando", "instalando"] },
      branchName,
      type,
      projectId: Number(projectId),
    },
  });
}

module.exports = findActiveDeploy;
