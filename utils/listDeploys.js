const prisma = require("../database/client");

// Más reciente primero.
const listDeploys = () => prisma.deploy.findMany({ orderBy: { createdAt: "desc" } });

module.exports = listDeploys;
