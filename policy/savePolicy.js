const fs = require("fs");
const POLICY_FILE = require("./policyFile");
const { validatePolicy } = require("./validatePolicy");

const savePolicy = (policy) => {
	const valid = validatePolicy(policy);
	const tmp = `${POLICY_FILE}.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(valid, null, 2) + "\n", { mode: 0o600 });
	fs.renameSync(tmp, POLICY_FILE);
	fs.chmodSync(POLICY_FILE, 0o600);
	return valid;
};

module.exports = savePolicy;
