const api = require('../gitlab');

const ENV_FILE_PATH = 'envs/.env.entorno';
const ENV_PARAMS = ['API_MONO_URL', 'STORE_API_URL'];

/**
 * Construye la acción de commit que apunta el fichero envs/.env.entorno al
 * entorno indicado: sustituye los valores de API_MONO_URL y STORE_API_URL por
 * la url del entorno.
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {string} ref - Rama o commit del que leer el fichero original.
 * @param {string} entornoUrl - Url del entorno con el que sincronizar,
 *     ej. "https://entornoproyecto1234.ejemplo.local:12443/".
 * @returns {Promise<{action: 'update', filePath: string, content: string}>}
 *     Acción para createBranchWithCommit.
 */
async function syncEntornoEnv(projectId, ref, entornoUrl) {
  const url = entornoUrl.replace(/\/+$/, '');

  const file = await api.RepositoryFiles.show(projectId, ENV_FILE_PATH, ref);
  let content = Buffer.from(file.content, 'base64').toString('utf8');

  for (const param of ENV_PARAMS) {
    const pattern = new RegExp(`^(${param}=).*$`, 'm');
    if (!pattern.test(content)) {
      throw new Error(`No se ha encontrado el parámetro ${param} en ${ENV_FILE_PATH}`);
    }
    content = content.replace(pattern, `$1'${url}'`);
  }

  return { action: 'update', filePath: ENV_FILE_PATH, content };
}

module.exports = syncEntornoEnv;
