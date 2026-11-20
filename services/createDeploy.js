const crypto = require("crypto");
const {
	createEntorno,
	findActiveDeploy,
	findRepository,
	HttpError,
	installEntorno,
	logError,
	openRemoteVscode,
	saveDeploy,
	updateDeploy,
} = require("../utils");

const describeError = (error) => error?.cause?.description ?? error.message ?? "Error desconocido";

const runDeploy = async (id, branchName, projectId, ref, type, entornoUrl, messenger, editActions, remoteInstall) => {
	try {
		const deployData = await createEntorno(branchName, projectId, ref, type, entornoUrl, messenger, editActions);

		// Los entornos test y los de remoteInstall: false (MCP) no se instalan aquí: lo hace el caller en su máquina.
		if (type === "test" || !remoteInstall) {
			await updateDeploy(id, { ...deployData, status: "listo" });
			return;
		}

		await updateDeploy(id, { ...deployData, status: "instalando" });

		await installEntorno(deployData);
		await updateDeploy(id, { status: "listo" });

		await openRemoteVscode(deployData.usuarioSsh, deployData.servidorSsh, deployData.puertoSsh, deployData.rutaRaiz);
	} catch (error) {
		console.error(`❌ Deploy ${id} fallido:`, error);
		await logError(`deploy ${id}`, error, { branchName, projectId, ref, type, entornoUrl });
		await updateDeploy(id, { status: "error", error: describeError(error) }).catch((updateError) =>
			logError(`deploy ${id} (updateDeploy)`, updateError)
		);
	}
};

// Si ya hay un deploy activo para el mismo repo/rama/tipo, se devuelve ese (isNew: false).
const createDeploy = async ({
	branchName,
	projectId,
	projectName,
	ref,
	type = "entorno",
	entornoUrl,
	messenger = false,
	editActions = [],
	remoteInstall = true,
}) => {
	if (!["entorno", "test"].includes(type)) {
		throw new HttpError(`Tipo de entorno desconocido: "${type}"`, 400);
	}

	if (projectId === undefined || projectId === null) {
		throw new HttpError(`Falta el id del repositorio a desplegar`, 400);
	}

	// "move" lleva previousPath; sin content, GitLab conserva el original.
	const invalidAction = editActions.find(
		(a) =>
			!["create", "update", "delete", "move"].includes(a?.action) ||
			!a?.filePath ||
			(a.action === "move" && !a.previousPath) ||
			(!["delete", "move"].includes(a.action) && typeof a.content !== "string")
	);
	if (invalidAction) {
		throw new HttpError(`Acción de edición inválida: ${JSON.stringify(invalidAction)}`, 400);
	}

	const activeDeploy = await findActiveDeploy(projectId, branchName, type);
	if (activeDeploy) {
		return { deploy: activeDeploy, isNew: false };
	}

	// Un caller MCP puede mandar solo el id: projectName se resuelve aquí.
	const resolvedProjectName = projectName ?? (await findRepository(projectId)).name;

	const deploy = {
		id: crypto.randomUUID(),
		branchName,
		projectId,
		projectName: resolvedProjectName,
		ref,
		type,
		entornoUrl,
		messenger,
		status: "creando",
		createdAt: new Date().toISOString(),
	};

	await saveDeploy(deploy);

	runDeploy(deploy.id, branchName, projectId, ref, type, entornoUrl, messenger, editActions, remoteInstall);

	return { deploy, isNew: true };
};

module.exports = createDeploy;
