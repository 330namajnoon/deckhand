const prisma = require("../database/client");

/**
 * Elimina un deploy de la base de datos.
 *
 * @param {string} id - Id del deploy a eliminar.
 * @returns {Promise<object>} El deploy eliminado.
 * @throws {Error} Si no existe ningún deploy con ese id.
 */
const removeDeploy = async (id) => {
	try {
		return await prisma.deploy.delete({ where: { id } });
	} catch (error) {
		if (error.code === "P2025") throw new Error(`No existe ningún deploy con id ${id}`);
		throw error;
	}
};

module.exports = removeDeploy;
