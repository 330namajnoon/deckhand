// Constantes de la aplicación.

// URL base del servidor de deckhand. Se puede sobrescribir con la variable
// VITE_API_URL en un fichero .env (ej: VITE_API_URL=http://10.0.0.5:4000).
// En el build de producción el front se sirve desde el propio backend
// (localhost:4000/dist), así que la API se llama con rutas relativas ('').
export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');

// Rutas de la API del backend. Las que dependen de un recurso concreto son
// funciones que reciben su id.
export const API_ROUTES = {
	deploy: `${API_URL}/deploy`,
	deploys: `${API_URL}/deploys`,
	deployById: (id: string) => `${API_URL}/deploys/${id}`,
	openVscode: (id: string) => `${API_URL}/deploys/${id}/open-vscode`,
	redeploy: (id: string) => `${API_URL}/deploys/${id}/redeploy`,
	repositories: `${API_URL}/repositories`,
	repositoryBranches: (id: number) => `${API_URL}/repositories/${id}/branches`,
	repositoryTree: (id: number, ref: string, path: string, recursive = false) =>
		`${API_URL}/repositories/${id}/tree?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}${recursive ? '&recursive=true' : ''}`,
	repositoryFile: (id: number, ref: string, path: string) =>
		`${API_URL}/repositories/${id}/file?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}`,
} as const;

// Cada cuánto se consulta el estado de un deploy en curso.
export const POLL_INTERVAL = 5000;

// Máximo de sugerencias que pintan los datalists de repositorio y rama,
// para no volcar listados enormes en el desplegable.
export const MAX_SUGGESTIONS = 5;
