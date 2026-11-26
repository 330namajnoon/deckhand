const fs = require("fs");
const { hashEncryptedFile, readMarker } = require("./marker");
const { ENCRYPTED_FILE } = require("./paths");

// skills/<nombre>/SKILL.md, agents/<nombre>.md, commands/<nombre>.md
const summarize = (files) => ({
	skills: files.filter((f) => /^skills\/[^/]+\/SKILL\.md$/.test(f)).map((f) => f.split("/")[1]),
	agents: files.filter((f) => /^agents\/[^/]+\.md$/.test(f)).map((f) => f.slice("agents/".length, -3)),
	commands: files.filter((f) => /^commands\/[^/]+\.md$/.test(f)).map((f) => f.slice("commands/".length, -3)),
});

const privateContentStatus = () => {
	if (!fs.existsSync(ENCRYPTED_FILE)) return { available: false, unlocked: false };

	const marker = readMarker();
	const unlocked = Boolean(marker) && marker.hash === hashEncryptedFile();

	return { available: true, unlocked, ...(unlocked ? summarize(marker.files) : {}) };
};

module.exports = privateContentStatus;
