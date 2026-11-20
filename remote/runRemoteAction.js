const { HttpError, logRemoteAction } = require("../utils");
const { readPolicy } = require("../policy");
const getRemoteDeploy = require("./getRemoteDeploy");

// block(reason) lanza un 403 y lo audita como bloqueado.
const runRemoteAction = async ({ deployId, tool, input }, action) => {
	const startedAt = Date.now();
	let blockedReason = null;

	const block = (reason) => {
		blockedReason = reason;
		throw new HttpError(`Bloqueado por la política de deckhand: ${reason}`, 403);
	};

	try {
		const deploy = await getRemoteDeploy(deployId);
		const policy = readPolicy();
		const result = await action({ deploy, policy, block });
		logRemoteAction({ deployId, tool, input, allowed: true, exitCode: result?.exitCode, durationMs: Date.now() - startedAt });
		return result;
	} catch (error) {
		logRemoteAction({
			deployId,
			tool,
			input,
			allowed: blockedReason === null,
			blockedReason,
			error: blockedReason === null ? error.message : null,
			durationMs: Date.now() - startedAt,
		});
		throw error;
	}
};

module.exports = runRemoteAction;
