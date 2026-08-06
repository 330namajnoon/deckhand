const api = require('../gitlab');

/**
 * Lista los repositorios de GitLab en los que el usuario es miembro,
 * para poder elegir uno en el selector de la página de deploy.
 *
 * @returns {Promise<{ id: number, name: string, pathWithNamespace: string }[]>}
 *          Repositorios ordenados por nombre.
 */
async function listRepositories() {
  // simple:true reduce el payload; sin paginar a mano, gitbeaker trae todas
  // las páginas. membership:true evita listar toda la instancia.
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
