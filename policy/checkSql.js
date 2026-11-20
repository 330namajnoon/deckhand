// Primeras palabras aceptadas en modo "readonly".
const READ_KEYWORDS = ["SELECT", "SHOW", "EXPLAIN", "DESCRIBE", "DESC", "WITH"];

// Sin comentarios ni literales: un ";" o un INTO OUTFILE dentro de un string no cuentan.
const stripSql = (sql) =>
	sql
		.replace(/\/\*[\s\S]*?\*\//g, " ")
		.replace(/(--|#)[^\n]*/g, " ")
		.replace(/'(?:[^'\\]|\\.|'')*'/g, "''")
		.replace(/"(?:[^"\\]|\\.|"")*"/g, '""')
		.replace(/`(?:[^`]|``)*`/g, "``")
		.trim();

// La protección real en readonly es la transacción READ ONLY; esto rechaza antes lo evidente y lo que ella no cubre.
const checkSql = (policy, sql) => {
	if (policy.database === "deny") {
		return { allowed: false, reason: 'La política de base de datos es "deny": no se permite ninguna query' };
	}

	const stripped = stripSql(sql).replace(/;\s*$/, "");
	if (!stripped) return { allowed: false, reason: "Query vacía" };
	if (stripped.includes(";")) return { allowed: false, reason: "Solo se permite una sentencia por llamada" };
	if (policy.database === "allow") return { allowed: true };

	const keyword = stripped.split(/\s+/)[0].toUpperCase();
	if (!READ_KEYWORDS.includes(keyword)) {
		return { allowed: false, reason: `Política "readonly": solo se permiten ${READ_KEYWORDS.join(", ")}` };
	}
	if (/\bINTO\s+(OUTFILE|DUMPFILE)\b/i.test(stripped)) {
		return { allowed: false, reason: "No se permite escribir ficheros con INTO OUTFILE/DUMPFILE" };
	}
	if (/\bFOR\s+UPDATE\b|\bLOCK\s+IN\s+SHARE\s+MODE\b/i.test(stripped)) {
		return { allowed: false, reason: "No se permiten lecturas con bloqueo" };
	}
	return { allowed: true };
};

module.exports = checkSql;
