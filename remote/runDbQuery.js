const execCommand = require("./execCommand");
const resolveRemotePath = require("./resolveRemotePath");
const shellQuote = require("./shellQuote");
const sftp = require("./sftp");

const readEnvVariable = (content, name) => {
	const line = content
		.split(/\r?\n/)
		.reverse()
		.find((l) => new RegExp(`^\\s*(export\\s+)?${name}\\s*=`).test(l));
	if (!line) return null;
	const value = line.slice(line.indexOf("=") + 1).trim();
	return value.replace(/^(['"])(.*)\1$/, "$2");
};

const findDatabaseUrl = async (deploy, { envFiles, urlVariable }) => {
	for (const file of envFiles) {
		const target = resolveRemotePath(deploy, file);
		if (!(await sftp.exists(deploy, target))) continue;
		const url = readEnvVariable((await sftp.readFile(deploy, target)).toString("utf8"), urlVariable);
		if (url) return { url, file: target };
	}
	throw new Error(`No se ha encontrado ${urlVariable} en ${envFiles.join(", ")}`);
};

const parseMysqlUrl = (raw) => {
	const url = new URL(raw);
	if (!["mysql:", "mariadb:", "pdo-mysql:"].includes(url.protocol)) {
		throw new Error(`Solo se soportan bases de datos MySQL/MariaDB (la URL es ${url.protocol}//...)`);
	}
	return {
		host: url.hostname || "127.0.0.1",
		port: url.port || "3306",
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database: decodeURIComponent(url.pathname.replace(/^\//, "")),
	};
};

const runDbQuery = async (deploy, policy, sql, { timeoutMs }) => {
	const { url, file } = await findDatabaseUrl(deploy, policy.databaseConnection);
	const conn = parseMysqlUrl(url);

	const body = sql.trim().replace(/;\s*$/, "");
	const script =
		policy.database === "readonly"
			? `SET SESSION TRANSACTION READ ONLY;\nSTART TRANSACTION READ ONLY;\n${body};\nROLLBACK;\n`
			: `${body};\n`;

	// La contraseña va por MYSQL_PWD (no en la línea de -p) y la query por stdin.
	const command = [
		`MYSQL_PWD=${shellQuote(conn.password)}`,
		"mysql --batch --table",
		`-h ${shellQuote(conn.host)}`,
		`-P ${shellQuote(conn.port)}`,
		`-u ${shellQuote(conn.user)}`,
		shellQuote(conn.database),
	].join(" ");

	const result = await execCommand(deploy, command, { cwd: "/", timeoutMs, stdin: script });

	return {
		exitCode: result.exitCode,
		timedOut: result.timedOut,
		output: result.stdout,
		error: result.stderr,
		source: `${conn.user}@${conn.host}:${conn.port}/${conn.database} (de ${file})`,
	};
};

module.exports = runDbQuery;
