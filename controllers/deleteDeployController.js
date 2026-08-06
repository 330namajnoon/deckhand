const { createController } = require("sm-express-server");
const fs = require("fs/promises");
const path = require("path");
const { deleteBranch, findRepository, logError, removeDeploy } = require("../utils");

const DEPLOYS_FILE = path.join(__dirname, "..", "database", "deploys.json");

const isBranchNotFound = (error) =>
	/not found|404/i.test(error?.cause?.description ?? error?.message ?? "");

// Borra un deploy: primero elimina su rama en GitLab (si existe) y después
// lo quita del listado. Si la rama no se puede borrar por otro motivo (p. ej.
// está protegida), el deploy no se elimina del listado.
const deleteDeployController = createController(async (req, res) => {
	const { id } = req.params;

	const deploys = JSON.parse(await fs.readFile(DEPLOYS_FILE, "utf8"));
	const deploy = deploys.find((d) => d.id === id);

	if (!deploy) {
		return res.status(404).send({ error: `No existe ningún deploy con id ${id}` });
	}

	// La rama del entorno se llama igual que el entorno. En deploys que
	// fallaron antes de crear el entorno se reconstruye con la misma regla.
	const normalize = (value) => value.toLowerCase().replace(/[-_]/g, "");
	const branchName = deploy.entornoName ?? `${deploy.type ?? "entorno"}${normalize(deploy.branchName)}${normalize(deploy.projectName)}`;

	try {
		const projectId = deploy.project?.id ?? (await findRepository(deploy.projectName)).id;

		console.log(`🗑️  Borrando rama "${branchName}" del proyecto ${deploy.projectName}...`);
		await deleteBranch(projectId, branchName);
		console.log(`✅ Rama borrada`);
	} catch (error) {
		if (!isBranchNotFound(error)) {
			console.error(`❌ No se ha podido borrar la rama "${branchName}":`, error);
			await logError(`DELETE /deploys/${id} (deleteBranch)`, error, { branchName, projectName: deploy.projectName });
			return res.status(502).send({ error: `No se ha podido borrar la rama "${branchName}": ${error.message}` });
		}
		console.log(`ℹ️  La rama "${branchName}" ya no existe, se continúa`);
	}

	const removed = await removeDeploy(id);

	res.send(removed);
});

module.exports = deleteDeployController;
