const listRepositories = require("./listRepositories");
const { SYNC_ENV_PROJECTS, FRONTEND_TEST_PROJECTS, MESSENGER_PROJECTS } = require("./repoRoles");

const ROLES = [
  { rol: "backend", names: SYNC_ENV_PROJECTS },
  { rol: "frontend", names: FRONTEND_TEST_PROJECTS },
  { rol: "api", names: MESSENGER_PROJECTS },
];

const paisFromName = (name) => name.match(/-(es|pt)$/)?.[1] ?? null;

async function getRepoCatalog() {
  const repos = await listRepositories();

  return repos.map((repo) => ({
    ...repo,
    pais: paisFromName(repo.name),
    rol: ROLES.find(({ names }) => names.includes(repo.name))?.rol ?? null,
  }));
}

module.exports = getRepoCatalog;
