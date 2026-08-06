const {
	getDeploy,
	HttpError,
	installEntorno,
	logError,
	openRemoteVscode,
	redeployEntorno: redeployEntornoUtil,
	updateDeploy,
} = require("../utils");

// Mensaje de un error con la descripción de la causa (gitbeaker la expone en
// error.cause.description) si la trae, si no el mensaje a secas.
const describeError = (error) => error?.cause?.description ?? error.message ?? "Error desconocido";

const runRedeploy = async (id, entornoName, projectId, type) => {
	try {
		const deployData = await redeployEntornoUtil(entornoName, projectId, { deleteFilesBranchEntorno: "1" });

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
		console.error(`❌ Redeploy ${id} fallido:`, error);
		await logError(`redeploy ${id}`, error, { entornoName, projectId, type });
		await updateDeploy(id, { status: "error", error: describeError(error) }).catch((updateError) =>
			logError(`redeploy ${id} (updateDeploy)`, updateError)
		);
	}
};

const redeployEntorno = async (id) => {
	const deploy = await getDeploy(id);

	if (!deploy) {
		throw new HttpError(`No existe ningún deploy con id ${id}`, 404);
	}

	if (!deploy.entornoName) {
		throw new HttpError(`El deploy no tiene entorno creado todavía, no se puede redesplegar`, 409);
	}

	if (["creando", "instalando"].includes(deploy.status)) {
		throw new HttpError(`El deploy ya está en estado "${deploy.status}"`, 409);
	}

	const updated = await updateDeploy(id, { status: "creando", error: undefined });

	// El id del repo puede venir guardado en el propio deploy (deploys nuevos);
	// si no, se cae al nombre (deploys antiguos, ambiguo si hay repos duplicados).
	const projectId = deploy.project?.id ?? deploy.projectName;

	runRedeploy(id, deploy.entornoName, projectId, deploy.type);

	return updated;
};

module.exports = redeployEntorno;
