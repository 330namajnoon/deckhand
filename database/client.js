const { PrismaClient } = require("../generated/prisma/client.ts");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
