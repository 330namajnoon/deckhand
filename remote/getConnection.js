const { Client } = require("ssh2");
const loginEntorno = require("../utils/loginEntorno");
const getEntornoPassword = require("../utils/getEntornoPassword");

// Conexiones reutilizadas entre llamadas; se cierran solas tras este tiempo sin uso.
const IDLE_MS = 5 * 60 * 1000;
const CONNECT_TIMEOUT_MS = 20 * 1000;

const pool = new Map();

// Servidor y puerto en la clave: tras un redeploy no se reutiliza la conexión antigua.
const keyOf = (deploy) => `${deploy.id}|${deploy.servidorSsh}|${deploy.puertoSsh}`;

const isAuthError = (error) => error?.level === "client-authentication";

const connect = (deploy, password) =>
	new Promise((resolve, reject) => {
		const client = new Client();
		client
			.on("ready", () => resolve(client))
			.on("error", reject)
			.on("keyboard-interactive", (_name, _instructions, _lang, prompts, answer) => answer(prompts.map(() => password)))
			.connect({
				host: deploy.servidorSsh,
				port: Number(deploy.puertoSsh),
				username: deploy.usuarioSsh || "root",
				password,
				tryKeyboard: true,
				readyTimeout: CONNECT_TIMEOUT_MS,
				keepaliveInterval: 15 * 1000,
				// Cada redeploy cambia la clave de host: no se verifica.
				hostVerifier: () => true,
			});
	});

const openSftp = (client) =>
	new Promise((resolve, reject) => client.sftp((error, sftp) => (error ? reject(error) : resolve(sftp))));

// Si falla la contraseña nueva, el entorno aún pide el cambio forzado: loginEntorno y reintento.
const open = async (deploy) => {
	const { password } = getEntornoPassword(deploy);

	let client;
	try {
		client = await connect(deploy, password);
	} catch (error) {
		if (!isAuthError(error)) throw error;
		await loginEntorno(deploy);
		client = await connect(deploy, password);
	}

	const sftp = await openSftp(client);
	return { client, sftp };
};

const getConnection = async (deploy) => {
	const key = keyOf(deploy);
	let entry = pool.get(key);

	if (!entry) {
		entry = { ready: open(deploy), timer: null };
		pool.set(key, entry);
		entry.ready
			.then(({ client }) => client.on("close", () => pool.get(key) === entry && pool.delete(key)))
			.catch(() => pool.get(key) === entry && pool.delete(key));
	}

	const connection = await entry.ready;

	clearTimeout(entry.timer);
	entry.timer = setTimeout(() => connection.client.end(), IDLE_MS);
	entry.timer.unref();

	return connection;
};

module.exports = getConnection;
