const api = require('../gitlab');

/**
 * Busca un texto dentro del contenido de los archivos de un repositorio
 * (equivalente a un grep remoto), usando la búsqueda "blobs" de GitLab.
 * Sin Elasticsearch/Advanced Search habilitado, la búsqueda a nivel de
 * proyecto solo cubre la rama por defecto del repo (no admite fijar un ref,
 * a diferencia de getRepositoryFile).
 *
 * @param {number|string} projectId - Id del proyecto en GitLab.
 * @param {string} search - Texto o término a buscar.
 * @returns {Promise<Array<{ path: string, ref: string, startLine: number, data: string }>>}
 *     Coincidencias con la ruta del archivo, la rama, la línea donde empieza
 *     el fragmento y el propio fragmento de contexto encontrado.
 */
async function searchRepository(projectId, search) {
  const results = await api.Search.all('blobs', search, { projectId });

  return results.map((r) => ({
    path: r.path,
    ref: r.ref,
    startLine: r.startline,
    data: r.data,
  }));
}

module.exports = searchRepository;
