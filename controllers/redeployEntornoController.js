const { createController } = require("sm-express-server");
const { getDeploy, redeployEntorno, installEntorno, logError, openRemoteVscode, updateDeploy } = require("../utils");

// Mensaje de un error con la descripción de la causa (gitbeaker la expone en
// error.cause.description) si la trae, si no el mensaje a secas.
const describeError = (error) => error?.cause?.description ?? error.message ?? "Error desconocido";

const runRedeploy = async (id, entornoName, projectId, type) => {
	try {
		const deployData = await redeployEntorno(entornoName, projectId, { deleteFilesBranchEntorno: "1" });

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

const redeployEntornoController = createController(async (req, res) => {
	const { id } = req.params;

	const deploy = await getDeploy(id);

	if (!deploy) {
		return res.status(404).send({ error: `No existe ningún deploy con id ${id}` });
	}

	if (!deploy.entornoName) {
		return res.status(409).send({ error: `El deploy no tiene entorno creado todavía, no se puede redesplegar` });
	}

	if (["creando", "instalando"].includes(deploy.status)) {
		return res.status(409).send({ error: `El deploy ya está en estado "${deploy.status}"` });
	}

	const updated = await updateDeploy(id, { status: "creando", error: undefined });

	// El id del repo puede venir guardado en el propio deploy (deploys nuevos);
	// si no, se cae al nombre (deploys antiguos, ambiguo si hay repos duplicados).
	const projectId = deploy.project?.id ?? deploy.projectName;

	runRedeploy(id, deploy.entornoName, projectId, deploy.type);

	res.status(202).send(updated);
});

module.exports = redeployEntornoController;
