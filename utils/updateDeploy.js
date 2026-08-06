const prisma = require("../database/client");

// Los llamantes pasan claves a `undefined` para limpiar un campo (p. ej.
// borrar el error al reintentar un redeploy); Prisma ignora `undefined` en
// `data`, así que aquí se traduce a `null` para conservar ese comportamiento.
const updateDeploy = async (id, changes) => {
	const data = Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value === undefined ? null : value]));

	try {
		return await prisma.deploy.update({ where: { id }, data });
	} catch (error) {
		if (error.code === "P2025") throw new Error(`No existe ningún deploy con id ${id}`);
		throw error;
	}
};

module.exports = updateDeploy;
