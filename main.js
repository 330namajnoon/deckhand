require('dotenv').config();

const { findRepository, listPipelines, listPipelineStages, getJobLog, createEntorno, installEntorno, deleteBranch, openRemoteVscode } = require("./utils");


(async () => {
	
	const data = await createEntorno("STORE-6042", "esim-api", "develop");
	const installResponse = await installEntorno(data);
	// await deleteBranch(data.project.id, data.entornoName);
	console.log(data)
	await openRemoteVscode(data.usuarioSsh, data.servidorSsh, data.puertoSsh, data.rutaRaiz);
})()