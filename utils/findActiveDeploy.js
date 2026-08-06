const fs = require("fs/promises");
const path = require("path");

const DEPLOYS_FILE = path.join(__dirname, "..", "database", "deploys.json");

/**
 * Busca, entre los deploys guardados, uno en curso (estado "creando" o
 * "instalando", es decir ni terminado ni fallido) para el mismo repositorio,
 * misma tarea y mismo tipo de entorno. Se usa para no lanzar un deploy
 * duplicado cuando la rama del entorno ya se está creando/desplegando.
 *
 * @param {number|string} projectId - Id del repositorio.
 * @param {string} branchName - Nombre de la tarea (ej. "STORE-2080").
 * @param {'entorno'|'test'} type - Tipo de entorno.
 * @returns {Promise<object|undefined>} El deploy en curso, si lo hay.
 */
async function findActiveDeploy(projectId, branchName, type) {
  const deploys = JSON.parse(await fs.readFile(DEPLOYS_FILE, "utf8"));

  return deploys.find(
    (deploy) =>
      ["creando", "instalando"].includes(deploy.status) &&
      deploy.branchName === branchName &&
      deploy.type === type &&
      String(deploy.projectId ?? deploy.project?.id) === String(projectId)
  );
}

module.exports = findActiveDeploy;
