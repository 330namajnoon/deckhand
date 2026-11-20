// Idempotente: si el id ya existe actualiza la fila. Uso: yarn node scripts/migrateDeploysJsonToDb.js
require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const { getDeploy, saveDeploy, updateDeploy } = require("../utils");

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
	createdAt: deploy.createdAt,
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
			if (await getDeploy(deploy.id)) await updateDeploy(deploy.id, data);
			else await saveDeploy({ id: deploy.id, ...data });
			ok++;
		} catch (error) {
			failed++;
			console.error(`❌ ${deploy.id} (${deploy.branchName}/${deploy.projectName}):`, error.message);
		}
	}

	console.log(`✅ ${ok} deploys migrados${failed > 0 ? `, ❌ ${failed} fallidos` : ""} (de ${deploys.length} en total)`);
}

main();
