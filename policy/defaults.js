// Los comandos de BD no son editables: los gobierna el ajuste `database`.
const DATABASE_COMMAND_PATTERNS = [
	{
		pattern: "\\b(mysql|mariadb|mysqldump|mariadb-dump|mysqladmin|mysqlimport|psql|pg_dump|pg_restore|sqlite3|mongo|mongosh|mongodump|redis-cli)\\b",
		reason: "Cliente de base de datos",
	},
	{
		pattern: "doctrine:(query|database|schema:(update|drop|create)|migrations:(migrate|execute|rollup|version)|fixtures:load)",
		reason: "Comando de Doctrine que lee o modifica la base de datos",
	},
	{ pattern: "dbal:run-sql", reason: "Comando de Doctrine que ejecuta SQL" },
];

const DEFAULT_POLICY = {
	// deny | readonly (solo lecturas vía remote_db_query, en transacción READ ONLY) | allow
	database: "deny",
	// Regex (sin distinguir mayúsculas) contra el comando completo de remote_exec.
	commandDenyPatterns: [
		{ pattern: "\\brm\\s+-\\w*[rR]\\w*\\s+(/|/\\*|~)(\\s|$)", reason: "Borrado recursivo de / o del home" },
		{ pattern: "\\b(shutdown|reboot|halt|poweroff)\\b", reason: "Apagar o reiniciar la máquina" },
		{ pattern: "\\bmkfs(\\.\\w+)?\\b", reason: "Formatear discos" },
		{ pattern: "\\bdd\\s+.*\\bof=/dev/", reason: "Escribir en un dispositivo" },
		{ pattern: ":\\(\\)\\s*\\{", reason: "Fork bomb" },
		{ pattern: "\\bgit\\s+push\\b", reason: "Los push los hace el usuario" },
		{ pattern: "\\b(passwd|chpasswd|usermod|userdel)\\b", reason: "Cambiar usuarios o contraseñas" },
		{ pattern: "\\bcrontab\\s+-r\\b", reason: "Borrar el crontab" },
	],
	// Sin "/": nombre del fichero; con "/" inicial: ruta absoluta; si no, relativa a la raíz del proyecto.
	writeDenyPaths: [
		{ pattern: "/etc/**", reason: "Configuración del sistema" },
		{ pattern: "/root/.ssh/**", reason: "Claves SSH" },
		{ pattern: "**/.git/**", reason: "Interior del repositorio git" },
	],
	// Primer fichero que exista con la variable; mismo orden que Symfony con APP_ENV=entorno.
	databaseConnection: {
		envFiles: [".env.entorno.local", ".env.entorno", ".env.local", ".env"],
		urlVariable: "DATABASE_URL",
	},
};

module.exports = { DEFAULT_POLICY, DATABASE_COMMAND_PATTERNS };
