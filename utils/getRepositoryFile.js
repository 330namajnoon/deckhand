const api = require('../gitlab');

/**
 * Obtiene el contenido de un fichero de un repositorio de GitLab, para poder
 * editarlo en el editor de código de la página de deploy.
 *
 * @param {number|string} projectId - Id del proyecto en GitLab.
 * @param {string} ref - Rama o commit del que leer el fichero.
 * @param {string} filePath - Ruta del fichero dentro del repo.
 * @returns {Promise<{ filePath: string, content: string }>} Ruta y contenido
 *     del fichero decodificado como utf8.
 */
async function getRepositoryFile(projectId, ref, filePath) {
  const file = await api.RepositoryFiles.show(projectId, filePath, ref);
  const content = Buffer.from(file.content, 'base64').toString('utf8');

  return { filePath, content };
}

module.exports = getRepositoryFile;
