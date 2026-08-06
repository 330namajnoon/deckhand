const prisma = require("../database/client");

const getDeploy = (id) => prisma.deploy.findUnique({ where: { id } });

module.exports = getDeploy;
