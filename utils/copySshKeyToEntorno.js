const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { Client } = require("ssh2");
const getEntornoPassword = require("./getEntornoPassword");

// Se guarda como id_rsa porque es lo que esperan los entornos ya creados.
const LOCAL_KEY = path.join(os.homedir(), ".ssh", "id_ed25519");
const REMOTE_DIR = ".ssh";
const REMOTE_KEY = ".ssh/id_rsa";

const connect = (entorno, password) =>
	new Promise((resolve, reject) => {
		const client = new Client();
		client
			.on("ready", () => resolve(client))
			.on("error", reject)
			.connect({
				host: entorno.servidorSsh,
				port: Number(entorno.puertoSsh),
				username: entorno.usuarioSsh || "root",
				password,
				readyTimeout: 15 * 1000,
				hostVerifier: () => true,
			});
	});

const sftpOf = (client) =>
	new Promise((resolve, reject) => client.sftp((error, sftp) => (error ? reject(error) : resolve(sftp))));

const promisified = (sftp, method, ...args) =>
	new Promise((resolve, reject) => sftp[method](...args, (error, result) => (error ? reject(error) : resolve(result))));

const copySshKeyToEntorno = async (entorno) => {
	let key;
	try {
		key = await fs.readFile(LOCAL_KEY);
	} catch (error) {
		if (error.code === "ENOENT") return { copied: false, reason: `No existe ${LOCAL_KEY}` };
		throw error;
	}

	const { password } = getEntornoPassword(entorno);
	const client = await connect(entorno, password);
	try {
		const sftp = await sftpOf(client);
		await promisified(sftp, "mkdir", REMOTE_DIR, { mode: 0o700 }).catch(() => {});
		await promisified(sftp, "writeFile", REMOTE_KEY, key, { mode: 0o600 });
		// writeFile solo aplica el modo al crear: si ya existía, se fuerza aquí.
		await promisified(sftp, "chmod", REMOTE_KEY, 0o600);

		const { size } = await promisified(sftp, "stat", REMOTE_KEY);
		if (size !== key.length) throw new Error(`la clave copiada ocupa ${size} bytes y la local ${key.length}`);

		return { copied: true, remotePath: `~/${REMOTE_KEY}` };
	} finally {
		client.end();
	}
};

module.exports = copySshKeyToEntorno;
