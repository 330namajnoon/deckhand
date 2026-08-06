// Migra el histórico de database/deploys.json a la tabla `deploys` de
// MariaDB (Prisma). Idempotente: usa upsert, así que se puede reejecutar sin
// duplicar filas. Uso: yarn node scripts/migrateDeploysJsonToDb.js
require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const prisma = require("../database/client");

const DEPLOYS_FILE = path.join(__dirname, "..", "database", "deploys.json");

const toData = (deploy) => ({
	branchName: deploy.branchName,
	projectId: deploy.projectId ?? deploy.project?.id ?? null,
	projectName: deploy.projectName,
	ref: deploy.ref,
	type: deploy.type ?? null,
	entornoUrl: deploy.entornoUrl ?? null,
	messenger: deploy.messenger ?? null,
	status: deploy.status,
	createdAt: new Date(deploy.createdAt),
	fechaCaducidad: deploy.fechaCaducidad ?? null,
	usuarioSsh: deploy.usuarioSsh ?? null,
	contrasenaSsh: deploy.contrasenaSsh ?? null,
	servidorSsh: deploy.servidorSsh ?? null,
	puertoSsh: deploy.puertoSsh ?? null,
	cadenaConexionSsh: deploy.cadenaConexionSsh ?? null,
	rutaRaiz: deploy.rutaRaiz ?? null,
	url: deploy.url ?? null,
	ideKeyXdebug: deploy.ideKeyXdebug ?? null,
	entornoName: deploy.entornoName ?? null,
	error: deploy.error ?? null,
	project: deploy.project ?? null,
});

async function main() {
	const deploys = JSON.parse(await fs.readFile(DEPLOYS_FILE, "utf8"));

	let ok = 0;
	let failed = 0;

	for (const deploy of deploys) {
		const data = toData(deploy);
		try {
			await prisma.deploy.upsert({ where: { id: deploy.id }, create: { id: deploy.id, ...data }, update: data });
			ok++;
		} catch (error) {
			failed++;
			console.error(`❌ ${deploy.id} (${deploy.branchName}/${deploy.projectName}):`, error.message);
		}
	}

	console.log(`✅ ${ok} deploys migrados${failed > 0 ? `, ❌ ${failed} fallidos` : ""} (de ${deploys.length} en total)`);
	await prisma.$disconnect();
}

main();
