const { deleteBranch, findRepository, getDeploy, HttpError, logError, removeDeploy } = require("../utils");

const isBranchNotFound = (error) =>
	/not found|404/i.test(error?.cause?.description ?? error?.message ?? "");

// Si la rama no se puede borrar (p. ej. protegida), el deploy no se elimina.
const deleteDeploy = async (id) => {
	const deploy = await getDeploy(id);

	if (!deploy) {
		throw new HttpError(`No existe ningún deploy con id ${id}`, 404);
	}

	// En deploys que fallaron antes de crear el entorno, el nombre de la rama se reconstruye con la misma regla.
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
			await logError(`deleteDeploy ${id} (deleteBranch)`, error, { branchName, projectName: deploy.projectName });
			throw new HttpError(`No se ha podido borrar la rama "${branchName}": ${error.message}`, 502);
		}
		console.log(`ℹ️  La rama "${branchName}" ya no existe, se continúa`);
	}

	return removeDeploy(id);
};

module.exports = deleteDeploy;
