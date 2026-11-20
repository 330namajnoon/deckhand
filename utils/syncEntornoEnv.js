const api = require('../gitlab');

const ENV_FILE_PATH = 'envs/.env.entorno';
const ENV_PARAMS = ['API_MONO_URL', 'STORE_API_URL'];

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
