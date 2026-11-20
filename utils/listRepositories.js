const api = require('../gitlab');

async function listRepositories() {
  // membership: true evita listar toda la instancia.
  const projects = await api.Projects.all({ membership: true, simple: true, perPage: 100 });

  return projects
    .map((p) => ({
      id: p.id,
      name: p.path,
      pathWithNamespace: p.path_with_namespace,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = listRepositories;
