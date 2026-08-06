const fs = require("fs/promises");
const path = require("path");

const DEPLOYS_FILE = path.join(__dirname, "..", "database", "deploys.json");

/**
 * Elimina un deploy del listado (database/deploys.json).
 *
 * @param {string} id - Id del deploy a eliminar.
 * @returns {Promise<object>} El deploy eliminado.
 * @throws {Error} Si no existe ningún deploy con ese id.
 */
const removeDeploy = async (id) => {
	const deploys = JSON.parse(await fs.readFile(DEPLOYS_FILE, "utf8"));

	const index = deploys.findIndex((deploy) => deploy.id === id);
	if (index === -1) throw new Error(`No existe ningún deploy con id ${id}`);

	const [removed] = deploys.splice(index, 1);

	await fs.writeFile(DEPLOYS_FILE, JSON.stringify(deploys, null, 2));

	return removed;
};

module.exports = removeDeploy;
