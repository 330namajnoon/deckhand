const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

// Formato: MAGIC | log2(N) | r | p | salt(16) | iv(12) | tag(16) | ciphertext. La cabecera va como AAD.
const MAGIC = Buffer.from("DKHPRIV1");
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const HEADER_LENGTH = MAGIC.length + 3 + SALT_LENGTH;
const DEFAULT_PARAMS = { log2N: 17, r: 8, p: 1 };

const deriveKey = (password, salt, { log2N, r, p }) => {
	const N = 2 ** log2N;
	return scrypt(password.normalize("NFC"), salt, 32, { N, r, p, maxmem: 256 * N * r });
};

const encrypt = async (plaintext, password) => {
	const salt = crypto.randomBytes(SALT_LENGTH);
	const iv = crypto.randomBytes(IV_LENGTH);
	const { log2N, r, p } = DEFAULT_PARAMS;
	const header = Buffer.concat([MAGIC, Buffer.from([log2N, r, p]), salt]);

	const cipher = crypto.createCipheriv("aes-256-gcm", await deriveKey(password, salt, DEFAULT_PARAMS), iv);
	cipher.setAAD(header);
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

	return Buffer.concat([header, iv, cipher.getAuthTag(), ciphertext]);
};

// GCM falla igual con contraseña incorrecta que con el fichero corrupto: no se pueden distinguir.
const decrypt = async (data, password) => {
	if (data.length < HEADER_LENGTH + IV_LENGTH + TAG_LENGTH || !data.subarray(0, MAGIC.length).equals(MAGIC)) {
		throw new Error("private.enc no tiene un formato válido");
	}

	const header = data.subarray(0, HEADER_LENGTH);
	const [log2N, r, p] = data.subarray(MAGIC.length, MAGIC.length + 3);
	const salt = data.subarray(MAGIC.length + 3, HEADER_LENGTH);
	const iv = data.subarray(HEADER_LENGTH, HEADER_LENGTH + IV_LENGTH);
	const tag = data.subarray(HEADER_LENGTH + IV_LENGTH, HEADER_LENGTH + IV_LENGTH + TAG_LENGTH);
	const ciphertext = data.subarray(HEADER_LENGTH + IV_LENGTH + TAG_LENGTH);

	const decipher = crypto.createDecipheriv("aes-256-gcm", await deriveKey(password, salt, { log2N, r, p }), iv);
	decipher.setAAD(header);
	decipher.setAuthTag(tag);
	try {
		return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	} catch {
		throw new Error("Contraseña incorrecta (o private.enc corrupto)");
	}
};

module.exports = { encrypt, decrypt };
