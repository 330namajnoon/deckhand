const prisma = require("../database/client");

const saveDeploy = async (deployData) => {
	await prisma.deploy.create({ data: deployData });
};

module.exports = saveDeploy;
