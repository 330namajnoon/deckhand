// Cifra los skills/agentes/commands privados (en claro y gitignored en skills/, agents/, commands/) en private.enc.
// La contraseña sale de PRIVATE_CONTENT_PASSWORD en el .env de la raíz.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), quiet: true });

const fs = require("fs");
const AdmZip = require("adm-zip");
const {
	PLUGIN_ROOT,
	ENCRYPTED_FILE,
	PASSWORD_SETTING,
	encrypt,
	decrypt,
	hashEncryptedFile,
	writeMarker,
	collectPrivateFiles,
} = require("../privateContent");

const MIN_PASSWORD_LENGTH = 32;

const main = async () => {
	const password = process.env[PASSWORD_SETTING];
	if (!password || password.length < MIN_PASSWORD_LENGTH) {
		throw new Error(`Pon en el .env ${PASSWORD_SETTING} con al menos ${MIN_PASSWORD_LENGTH} caracteres (p. ej. openssl rand -base64 48)`);
	}

	const files = collectPrivateFiles();
	if (!files.length) throw new Error("No hay nada que cifrar en skills/, agents/ ni commands/");

	const zip = new AdmZip();
	for (const rel of files) zip.addFile(rel, fs.readFileSync(`${PLUGIN_ROOT}/${rel}`));
	const plaintext = zip.toBuffer();

	const encrypted = await encrypt(plaintext, password);
	if (!(await decrypt(encrypted, password)).equals(plaintext)) throw new Error("La comprobación de descifrado ha fallado");

	fs.writeFileSync(ENCRYPTED_FILE, encrypted);
	// Lo que hay en claro ya corresponde a este private.enc: que el arranque no lo vuelva a descifrar encima.
	writeMarker(hashEncryptedFile(), files);

	console.log(`private.enc: ${files.length} ficheros cifrados`);
	for (const rel of files) console.log(`  ${rel}`);
};

main().catch((error) => {
	console.error(`❌ ${error.message}`);
	process.exit(1);
});
