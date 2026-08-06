const api = require('../gitlab');

const SUPERVISOR_DEV_PATH = 'supervisor/dev/messenger-consume.conf';
const SUPERVISOR_ENTORNO_PATH = 'supervisor/entorno/messenger-consume.conf';
const MESSENGER_YAML_PATH = 'config/packages/messenger.yaml';

const readFile = async (projectId, filePath, ref) => {
  const file = await api.RepositoryFiles.show(projectId, filePath, ref);
  return Buffer.from(file.content, 'base64').toString('utf8');
};

/**
 * Construye las acciones de commit que habilitan el messenger en un entorno:
 *
 * - supervisor/entorno/messenger-consume.conf: se rellena con el contenido de
 *   supervisor/dev/messenger-consume.conf, cambiando las colas dev_* por
 *   ent_*_s (ej. dev_migration → ent_migration_s).
 * - config/packages/messenger.yaml: a todos los transports ent_* del bloque
 *   when@entorno se les añade el sufijo _s, tanto en el nombre del transport
 *   como en su queue_name y en el routing (ej. ent_migration → ent_migration_s).
 *
 * @param {number|string} projectId - Id del proyecto o su path completo.
 * @param {string} ref - Rama o commit del que leer los ficheros originales.
 * @returns {Promise<Array<{action: 'update', filePath: string, content: string}>>}
 *     Acciones para createBranchWithCommit.
 */
async function enableMessenger(projectId, ref) {
  const [supervisorDev, messengerYaml] = await Promise.all([
    readFile(projectId, SUPERVISOR_DEV_PATH, ref),
    readFile(projectId, MESSENGER_YAML_PATH, ref),
  ]);

  const supervisorEntorno = supervisorDev.replace(/\bdev_(\w+)/g, 'ent_$1_s');

  // Los transports ent_* solo existen dentro del bloque when@entorno, así que
  // el reemplazo global no toca las demás configuraciones (dev_, prod...).
  const yamlContent = messengerYaml.replace(/\bent_\w+/g, '$&_s');

  return [
    { action: 'update', filePath: SUPERVISOR_ENTORNO_PATH, content: supervisorEntorno },
    { action: 'update', filePath: MESSENGER_YAML_PATH, content: yamlContent },
  ];
}

module.exports = enableMessenger;
