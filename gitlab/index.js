const { Gitlab } = require('@gitbeaker/rest');
const { getSetting } = require('../settings');

// Se recrea si cambian host o token, así que los cambios del panel se aplican sin reiniciar.
let client;
let clientKey;

const getClient = () => {
  const host = getSetting('GITLAB_HOST');
  const token = getSetting('GITLAB_TOKEN');

  if (!host || !token) {
    throw new Error('Faltan GITLAB_HOST o GITLAB_TOKEN: configúralos en el panel de deckhand (/deckhand:settings)');
  }

  const key = `${host}\n${token}`;
  if (!client || key !== clientKey) {
    client = new Gitlab({ host, token });
    clientKey = key;
  }
  return client;
};

module.exports = new Proxy({}, { get: (_target, prop) => getClient()[prop] });
