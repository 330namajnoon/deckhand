// Tipos compartidos entre páginas y componentes.

export type DeployStatus = 'creando' | 'instalando' | 'listo' | 'error';

export type EntornoType = 'entorno' | 'test';

export type Deploy = {
	id: string;
	branchName: string;
	projectId?: number;
	projectName: string;
	ref: string;
	type?: EntornoType;
	status: DeployStatus;
	createdAt: string;
	error?: string;
	url?: string;
	entornoName?: string;
	cadenaConexionSsh?: string;
	usuarioSsh?: string;
	contrasenaSsh?: string;
	servidorSsh?: string;
	puertoSsh?: string;
	fechaCaducidad?: string;
};

export type Repository = {
	id: number;
	name: string;
	pathWithNamespace: string;
};

// Entrada del árbol de ficheros de un repo (carpeta o fichero).
export type TreeEntry = {
	name: string;
	path: string;
	type: 'tree' | 'blob';
};

// Contenido de un fichero del repo, tal y como lo devuelve el backend.
export type RepositoryFile = {
	filePath: string;
	content: string;
};

// Acción de commit de GitLab con un cambio hecho en el editor de código.
// "move" son los renombrados y las copias de carpetas/ficheros: previousPath
// es la ruta original y content es opcional (si no se manda, GitLab conserva
// el contenido original al mover).
export type EditAction =
	| { action: 'update' | 'create'; filePath: string; content: string }
	| { action: 'delete'; filePath: string }
	| { action: 'move'; filePath: string; previousPath: string; content?: string };
