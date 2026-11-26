const paths = require("./paths");
const { encrypt, decrypt } = require("./cipher");
const { hashEncryptedFile, writeMarker } = require("./marker");
const collectPrivateFiles = require("./collectPrivateFiles");
const unlockPrivateContent = require("./unlockPrivateContent");
const privateContentStatus = require("./privateContentStatus");
const ensurePrivateContent = require("./ensurePrivateContent");

module.exports = {
	...paths,
	encrypt,
	decrypt,
	hashEncryptedFile,
	writeMarker,
	collectPrivateFiles,
	unlockPrivateContent,
	privateContentStatus,
	ensurePrivateContent,
};
