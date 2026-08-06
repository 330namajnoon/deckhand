const api = require('../gitlab');

const TEMPLATE_SUBPATH = 'envs/template-branches-test';
const ENV_FILE_NAME = 'environment.js';

/**
 * Construye las acciones de commit que duplican cada carpeta
 * envs/template-branches-test del repo como envs/<branchName> (los frontends
 * de test cargan su configuración desde la carpeta con el nombre de su rama).
 * Los store-frontend-v2-* son monorepos con varias apps (checkout, coverage),
 * cada una con su carpeta envs; se duplican todas.
 *
 * Si se indica entornoUrl, el environment.js de cada copia se reescribe para
 * apuntar window.env_target a esa url; si no, las carpetas se duplican tal cual.
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {string} ref - Rama o commit del que leer la plantilla.
 * @param {string} branchName - Nombre de la rama a crear; da nombre a las carpetas.
 * @param {string} [entornoUrl] - Url del entorno con el que sincronizar,
 *     ej. "https://entornoproyecto1234.ejemplo.local:12443/".
 * @returns {Promise<Array<{action: 'create', filePath: string, content: string, encoding?: string}>>}
 *     Acciones para createBranchWithCommit.
 */
async function duplicateTestEnvFolder(projectId, ref, branchName, entornoUrl) {
  const entries = await api.Repositories.allRepositoryTrees(projectId, { ref, recursive: true, perPage: 100 });

  const files = entries.filter(
    (e) => e.type === 'blob' && (e.path.startsWith(`${TEMPLATE_SUBPATH}/`) || e.path.includes(`/${TEMPLATE_SUBPATH}/`))
  );
  if (files.length === 0) {
    throw new Error(`No se ha encontrado ninguna carpeta ${TEMPLATE_SUBPATH} en la rama "${ref}"`);
  }

  const actions = [];
  for (const file of files) {
    const targetPath = file.path.replace(`${TEMPLATE_SUBPATH}/`, `envs/${branchName}/`);
    const raw = await api.RepositoryFiles.show(projectId, file.path, ref);

    if (entornoUrl && file.name === ENV_FILE_NAME) {
      const url = entornoUrl.replace(/\/+$/, '');
      let content = Buffer.from(raw.content, 'base64').toString('utf8');
      const pattern = /^(\s*window\.env_target\s*=\s*)(['"]).*?\2/m;
      if (!pattern.test(content)) {
        throw new Error(`No se ha encontrado window.env_target en ${file.path}`);
      }
      content = content.replace(pattern, `$1$2${url}$2`);
      actions.push({ action: 'create', filePath: targetPath, content });
    } else {
      // El resto de ficheros se copian tal cual, en base64 por si son binarios.
      actions.push({ action: 'create', filePath: targetPath, content: raw.content, encoding: 'base64' });
    }
  }

  return actions;
}

module.exports = duplicateTestEnvFolder;
