const crypto = require("crypto");
const fs = require("fs");
const { ENCRYPTED_FILE, MARKER_FILE } = require("./paths");

const hashEncryptedFile = () => crypto.createHash("sha256").update(fs.readFileSync(ENCRYPTED_FILE)).digest("hex");

const readMarker = () => {
	try {
		return JSON.parse(fs.readFileSync(MARKER_FILE, "utf8"));
	} catch {
		return null;
	}
};

// files: rutas relativas (posix) a la raíz del plugin.
const writeMarker = (hash, files) => {
	fs.writeFileSync(MARKER_FILE, JSON.stringify({ hash, files, unlockedAt: new Date().toISOString() }, null, 2) + "\n");
};

module.exports = { hashEncryptedFile, readMarker, writeMarker };
