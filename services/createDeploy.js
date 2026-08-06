const crypto = require("crypto");
const { createEntorno, findActiveDeploy, HttpError, installEntorno, logError, openRemoteVscode, saveDeploy, updateDeploy } = require("../utils");

// Mensaje de un error con la descripción de la causa (gitbeaker la expone en
// error.cause.description) si la trae, si no el mensaje a secas.
const describeError = (error) => error?.cause?.description ?? error.message ?? "Error desconocido";

const runDeploy = async (id, branchName, projectId, ref, type, entornoUrl, messenger, editActions) => {
	try {
		const deployData = await createEntorno(branchName, projectId, ref, type, entornoUrl, messenger, editActions);

		// Los entornos de tipo test solo se despliegan: ni instalación ni VS Code.
		if (type === "test") {
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

// Crea un deploy nuevo. Si ya hay uno activo para el mismo repo/rama/tipo,
// no se lanza uno nuevo: se devuelve el existente (isNew: false) para que el
// caller (controller o tool MCP) pueda responder 200 en vez de 202.
const createDeploy = async ({ branchName, projectId, projectName, ref, type = "entorno", entornoUrl, messenger = false, editActions = [] }) => {
	if (!["entorno", "test"].includes(type)) {
		throw new HttpError(`Tipo de entorno desconocido: "${type}"`, 400);
	}

	if (projectId === undefined || projectId === null) {
		throw new HttpError(`Falta el id del repositorio a desplegar`, 400);
	}

	// Cambios hechos en el editor de código de la página de deploy: acciones
	// de commit de GitLab que se aplican en el primer commit de la rama. "move"
	// son los renombrados/duplicados de carpetas y ficheros: llevan previousPath
	// y el content es opcional (si no se manda, GitLab conserva el original).
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

	// La rama del entorno se genera de forma determinista a partir de tarea +
	// repo + tipo, así que un deploy en curso (ni terminado ni fallido) para la
	// misma combinación ya está creando/usando esa misma rama: no se lanza un
	// deploy nuevo, se sigue con el mismo.
	const activeDeploy = await findActiveDeploy(projectId, branchName, type);
	if (activeDeploy) {
		return { deploy: activeDeploy, isNew: false };
	}

	const deploy = {
		id: crypto.randomUUID(),
		branchName,
		projectId,
		projectName,
		ref,
		type,
		entornoUrl,
		messenger,
		status: "creando",
		createdAt: new Date().toISOString(),
	};

	await saveDeploy(deploy);

	runDeploy(deploy.id, branchName, projectId, ref, type, entornoUrl, messenger, editActions);

	return { deploy, isNew: true };
};

module.exports = createDeploy;
