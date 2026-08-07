const listRepositories = require("./listRepositories");
const { SYNC_ENV_PROJECTS, FRONTEND_TEST_PROJECTS, MESSENGER_PROJECTS } = require("./repoRoles");

const ROLES = [
  { rol: "backend", names: SYNC_ENV_PROJECTS },
  { rol: "frontend", names: FRONTEND_TEST_PROJECTS },
  { rol: "api", names: MESSENGER_PROJECTS },
];

// País a partir del sufijo del nombre del repo, ej. "store-api-es" → "es".
const paisFromName = (name) => name.match(/-(es|pt)$/)?.[1] ?? null;

/**
 * Clasifica los repos de listRepositories por país y rol, a partir de la
 * misma convención de nombres (store-<rol>-<pais>) que createEntorno.js usa
 * para decidir su comportamiento (sync de entornoUrl, carpeta de test,
 * messenger) — ver utils/repoRoles.js. Evita tener que deducir a qué país
 * corresponde cada projectId leyendo deploys ajenos.
 *
 * @returns {Promise<Array<{
 *   id: number, name: string, pathWithNamespace: string,
 *   pais: 'es'|'pt'|null, rol: 'api'|'backend'|'frontend'|null
 * }>>} Repos ordenados por nombre; pais/rol son null cuando el repo no sigue
 *     la convención store-<rol>-<pais> conocida.
 */
async function getRepoCatalog() {
  const repos = await listRepositories();

  return repos.map((repo) => ({
    ...repo,
    pais: paisFromName(repo.name),
    rol: ROLES.find(({ names }) => names.includes(repo.name))?.rol ?? null,
  }));
}

module.exports = getRepoCatalog;
