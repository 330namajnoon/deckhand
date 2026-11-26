const { getRemoteDeploy, contextNoticeFor } = require("../remote");

// Para las remote_*: la primera vez que se toca un entorno con CLAUDE.md/.claude sin haber llamado a
// remote_load_context, antepone al resultado un aviso para que el agente cargue esas instrucciones.
const withEntornoContextNotice = (handler) => async (args, extra) => {
	const result = await handler(args, extra);
	if (result?.isError || !args?.deployId) return result;

	try {
		const notice = await contextNoticeFor(await getRemoteDeploy(args.deployId));
		if (notice) return { ...result, content: [{ type: "text", text: notice }, ...result.content] };
	} catch {
		// El aviso es una ayuda: si falla, el resultado de la tool sale igual.
	}
	return result;
};

module.exports = withEntornoContextNotice;
