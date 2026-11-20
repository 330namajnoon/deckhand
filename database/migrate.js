// Para cambiar el esquema, añade una entrada al final; nunca edites una ya publicada.
const MIGRATIONS = [
	`CREATE TABLE deploys (
		id                TEXT PRIMARY KEY,
		branchName        TEXT NOT NULL,
		projectId         INTEGER,
		projectName       TEXT NOT NULL,
		ref               TEXT NOT NULL,
		type              TEXT CHECK (type IN ('entorno', 'test')),
		entornoUrl        TEXT,
		messenger         INTEGER,
		status            TEXT NOT NULL CHECK (status IN ('creando', 'instalando', 'listo', 'error')),
		createdAt         TEXT NOT NULL,
		fechaCaducidad    TEXT,
		usuarioSsh        TEXT,
		contrasenaSsh     TEXT,
		servidorSsh       TEXT,
		puertoSsh         TEXT,
		cadenaConexionSsh TEXT,
		rutaRaiz          TEXT,
		url               TEXT,
		ideKeyXdebug      TEXT,
		entornoName       TEXT,
		error             TEXT,
		project           TEXT
	);
	CREATE INDEX deploys_createdAt ON deploys (createdAt);`,
	// Sin FK a deploys: la auditoría se conserva aunque se borre el deploy.
	`CREATE TABLE remote_actions (
		id            INTEGER PRIMARY KEY AUTOINCREMENT,
		deployId      TEXT NOT NULL,
		tool          TEXT NOT NULL,
		input         TEXT NOT NULL,
		allowed       INTEGER NOT NULL,
		blockedReason TEXT,
		exitCode      INTEGER,
		error         TEXT,
		durationMs    INTEGER,
		createdAt     TEXT NOT NULL
	);
	CREATE INDEX remote_actions_deploy ON remote_actions (deployId, createdAt);`,
];

const migrate = (db) => {
	const { user_version: current } = db.prepare("PRAGMA user_version").get();

	for (let version = current; version < MIGRATIONS.length; version++) {
		db.exec("BEGIN");
		try {
			db.exec(MIGRATIONS[version]);
			db.exec(`PRAGMA user_version = ${version + 1}`);
			db.exec("COMMIT");
		} catch (error) {
			db.exec("ROLLBACK");
			throw error;
		}
	}
};

module.exports = migrate;
