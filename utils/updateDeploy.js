const db = require("../database/client");
const { toRow } = require("../database/deployRow");
const getDeploy = require("./getDeploy");

// Una clave a `undefined` limpia el campo (se escribe como null).
const updateDeploy = async (id, changes) => {
	const { id: _ignored, ...row } = toRow(changes);
	const columns = Object.keys(row);

	if (columns.length > 0) {
		const { changes: updated } = db
			.prepare(`UPDATE deploys SET ${columns.map((c) => `${c} = :${c}`).join(", ")} WHERE id = :id`)
			.run({ ...row, id });
		if (updated === 0) throw new Error(`No existe ningún deploy con id ${id}`);
	}

	const deploy = await getDeploy(id);
	if (!deploy) throw new Error(`No existe ningún deploy con id ${id}`);
	return deploy;
};

module.exports = updateDeploy;
