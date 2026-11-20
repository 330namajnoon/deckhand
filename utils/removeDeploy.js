const db = require("../database/client");
const getDeploy = require("./getDeploy");

const removeDeploy = async (id) => {
	const deploy = await getDeploy(id);
	if (!deploy) throw new Error(`No existe ningún deploy con id ${id}`);

	db.prepare("DELETE FROM deploys WHERE id = ?").run(id);
	return deploy;
};

module.exports = removeDeploy;
