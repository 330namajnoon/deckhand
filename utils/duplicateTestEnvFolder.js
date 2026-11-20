const api = require('../gitlab');

const TEMPLATE_SUBPATH = 'envs/template-branches-test';
const ENV_FILE_NAME = 'environment.js';

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
      actions.push({ action: 'create', filePath: targetPath, content: raw.content, encoding: 'base64' });
    }
  }

  return actions;
}

module.exports = duplicateTestEnvFolder;
