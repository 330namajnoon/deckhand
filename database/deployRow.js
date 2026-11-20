// SQLite no tiene booleanos, fechas ni JSON: messenger va como 0/1, createdAt como ISO y project como JSON.
const COLUMNS = [
	"id",
	"branchName",
	"projectId",
	"projectName",
	"ref",
	"type",
	"entornoUrl",
	"messenger",
	"status",
	"createdAt",
	"fechaCaducidad",
	"usuarioSsh",
	"contrasenaSsh",
	"servidorSsh",
	"puertoSsh",
	"cadenaConexionSsh",
	"rutaRaiz",
	"url",
	"ideKeyXdebug",
	"entornoName",
	"error",
	"project",
];

const toColumnValue = (column, value) => {
	if (value === undefined || value === null) return null;
	if (column === "messenger") return value ? 1 : 0;
	if (column === "createdAt") return new Date(value).toISOString();
	if (column === "project") return JSON.stringify(value);
	if (column === "projectId") return Number(value);
	return value;
};

// undefined pasa a null para que limpie el campo.
const toRow = (data) =>
	Object.fromEntries(
		Object.entries(data)
			.filter(([column]) => COLUMNS.includes(column))
			.map(([column, value]) => [column, toColumnValue(column, value)])
	);

const fromRow = (row) => {
	if (!row) return null;
	return {
		...row,
		messenger: row.messenger === null ? null : Boolean(row.messenger),
		project: row.project === null ? null : JSON.parse(row.project),
	};
};

module.exports = { COLUMNS, toRow, fromRow };
