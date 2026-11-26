const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { decrypt } = require("./cipher");
const { hashEncryptedFile, readMarker, writeMarker } = require("./marker");
const { PLUGIN_ROOT, ENCRYPTED_FILE, CONTENT_DIRS, PUBLIC_FILES } = require("./paths");

// Solo rutas relativas dentro de skills/, agents/ o commands/, y nunca encima de un fichero público.
const isAllowedPath = (rel) => {
	const parts = rel.split("/");
	return (
		parts.length >= 2 &&
		CONTENT_DIRS.includes(parts[0]) &&
		!parts.some((part) => part === "" || part === "." || part === "..") &&
		!rel.includes("\\") &&
		!PUBLIC_FILES.includes(rel)
	);
};

// Descifra private.enc dentro de la raíz del plugin. Lanza si la contraseña no vale, sin tocar nada.
const unlockPrivateContent = async (password) => {
	if (!fs.existsSync(ENCRYPTED_FILE)) throw new Error("Este plugin no trae contenido cifrado (private.enc)");

	const hash = hashEncryptedFile();
	const zip = new AdmZip(await decrypt(fs.readFileSync(ENCRYPTED_FILE), password));
	const entries = zip.getEntries().filter((entry) => !entry.isDirectory);

	const rejected = entries.map((entry) => entry.entryName).filter((rel) => !isAllowedPath(rel));
	if (rejected.length) throw new Error(`private.enc contiene rutas no permitidas: ${rejected.join(", ")}`);

	const files = entries.map((entry) => entry.entryName).sort();

	// Lo que se descifró de una versión anterior y ya no viene.
	for (const stale of readMarker()?.files ?? []) {
		if (!files.includes(stale) && isAllowedPath(stale)) fs.rmSync(path.join(PLUGIN_ROOT, ...stale.split("/")), { force: true });
	}

	for (const entry of entries) {
		const dest = path.join(PLUGIN_ROOT, ...entry.entryName.split("/"));
		fs.mkdirSync(path.dirname(dest), { recursive: true });
		fs.writeFileSync(dest, entry.getData());
	}

	writeMarker(hash, files);
	return files;
};

module.exports = unlockPrivateContent;
