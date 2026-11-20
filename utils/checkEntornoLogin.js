const { Client } = require("ssh2");

// expect puede acabar bien aunque el servidor rechace la contraseña nueva: esta es la única prueba fiable.
const checkEntornoLogin = ({ servidorSsh, puertoSsh, usuarioSsh }, password) =>
	new Promise((resolve) => {
		const client = new Client();
		let output = "";
		const done = (result) => {
			client.end();
			resolve(result);
		};

		client
			.on("ready", () => {
				client.exec("echo CAMBIO-OK", (error, stream) => {
					if (error) return done({ ok: false, reason: error.message });
					stream.on("data", (chunk) => (output += chunk));
					stream.stderr.on("data", (chunk) => (output += chunk));
					stream.on("close", () =>
						done(output.includes("CAMBIO-OK") ? { ok: true } : { ok: false, reason: output.trim() || "sin respuesta" })
					);
				});
			})
			.on("error", (error) => done({ ok: false, reason: error.message }))
			.connect({
				host: servidorSsh,
				port: Number(puertoSsh),
				username: usuarioSsh || "root",
				password,
				readyTimeout: 15 * 1000,
				hostVerifier: () => true,
			});
	});

module.exports = checkEntornoLogin;
