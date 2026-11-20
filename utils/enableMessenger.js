const api = require('../gitlab');

const SUPERVISOR_DEV_PATH = 'supervisor/dev/messenger-consume.conf';
const SUPERVISOR_ENTORNO_PATH = 'supervisor/entorno/messenger-consume.conf';
const MESSENGER_YAML_PATH = 'config/packages/messenger.yaml';

const readFile = async (projectId, filePath, ref) => {
  const file = await api.RepositoryFiles.show(projectId, filePath, ref);
  return Buffer.from(file.content, 'base64').toString('utf8');
};

async function enableMessenger(projectId, ref) {
  const [supervisorDev, messengerYaml] = await Promise.all([
    readFile(projectId, SUPERVISOR_DEV_PATH, ref),
    readFile(projectId, MESSENGER_YAML_PATH, ref),
  ]);

  const supervisorEntorno = supervisorDev.replace(/\bdev_(\w+)/g, 'ent_$1_s');

  // Los transports ent_* solo existen en when@entorno: el reemplazo global no toca el resto.
  const yamlContent = messengerYaml.replace(/\bent_\w+/g, '$&_s');

  return [
    { action: 'update', filePath: SUPERVISOR_ENTORNO_PATH, content: supervisorEntorno },
    { action: 'update', filePath: MESSENGER_YAML_PATH, content: yamlContent },
  ];
}

module.exports = enableMessenger;
