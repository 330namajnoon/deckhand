const { Client } = require("ssh2");

const TIMEOUT_MS = 60 * 1000;

// "Retype new" antes que "New": el segundo también casa con el primero.
const answerFor = (text) => {
	if (/BAD PASSWORD/i.test(text)) return "bad";
	if (/retype new.*password:\s*$/i.test(text)) return "new";
	if (/new.*password:\s*$/i.test(text)) return "new";
	if (/current.*password:\s*$/i.test(text)) return "old";
	if (/[$#] $/.test(text)) return "exit";
	return null;
};

const changePasswordError = (message, code) => Object.assign(new Error(message), { code });

// Cambio de contraseña forzado sin binarios externos: shell con pty (sin TTY sshd no deja cambiarla).
const changeEntornoPassword = ({ servidorSsh, puertoSsh, usuarioSsh }, oldPassword, newPassword) =>
	new Promise((resolve, reject) => {
		const client = new Client();
		let buffer = "";
		let settled = false;

		const finish = (error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			client.end();
			if (error) reject(error);
			else resolve();
		};

		const timer = setTimeout(
			() => finish(changePasswordError("El login SSH se ha quedado atascado en el cambio de contraseña", "STUCK")),
			TIMEOUT_MS,
		);

		client
			.on("ready", () => {
				client.shell({ term: "dumb", cols: 200, rows: 50 }, (error, stream) => {
					if (error) return finish(error);
					const onData = (chunk) => {
						buffer += chunk.toString();
						const answer = answerFor(buffer.slice(-300));
						if (!answer) return;
						buffer = "";
						if (answer === "bad") return finish(changePasswordError("El entorno rechaza la contraseña nueva", "BAD_PASSWORD"));
						if (answer === "exit") return stream.write("exit\n");
						stream.write(`${answer === "new" ? newPassword : oldPassword}\n`);
					};
					stream.on("data", onData);
					stream.stderr.on("data", onData);
					stream.on("close", () => finish());
				});
			})
			// Con PAM por keyboard-interactive el cambio puede llegar en la propia autenticación.
			.on("keyboard-interactive", (_name, _instructions, _lang, prompts, answer) => {
				answer(prompts.map(({ prompt }) => (answerFor(prompt) === "new" ? newPassword : oldPassword)));
			})
			.on("change password", (_prompt, done) => done(newPassword))
			.on("error", finish)
			.connect({
				host: servidorSsh,
				port: Number(puertoSsh),
				username: usuarioSsh || "root",
				password: oldPassword,
				tryKeyboard: true,
				readyTimeout: 15 * 1000,
				hostVerifier: () => true,
			});
	});

module.exports = changeEntornoPassword;
