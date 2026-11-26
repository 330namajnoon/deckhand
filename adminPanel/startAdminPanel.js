const http = require("http");
const crypto = require("crypto");
const { describeSettings, saveSettings, CONFIG_FILE } = require("../settings");
const { readPolicy, savePolicy, DEFAULT_POLICY, POLICY_FILE } = require("../policy");
const { PASSWORD_SETTING, privateContentStatus, unlockPrivateContent } = require("../privateContent");
const api = require("../gitlab");
const renderPage = require("./renderPage");

// Se cierra solo tras este tiempo sin peticiones.
const IDLE_MS = 30 * 60 * 1000;
const MAX_BODY = 64 * 1024;

let running = null;

const send = (res, status, body, type = "application/json; charset=utf-8") => {
	res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
	res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
};

const readJson = (req) =>
	new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > MAX_BODY) {
				reject(new Error("Petición demasiado grande"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
			} catch {
				reject(new Error("JSON inválido"));
			}
		});
		req.on("error", reject);
	});

const stateBody = () => ({ settings: describeSettings(), configFile: CONFIG_FILE, privateContent: privateContentStatus() });

// Una contraseña nueva del contenido privado se comprueba descifrando antes de guardar nada.
const saveSettingsBody = async (values, clear) => {
	const password = typeof values[PASSWORD_SETTING] === "string" ? values[PASSWORD_SETTING].trim() : "";
	if (password && privateContentStatus().available) await unlockPrivateContent(password);

	saveSettings(values, clear);
	return stateBody();
};

// Con policy.json roto se devuelve el error y los valores por defecto, para poder arreglarlo desde el panel.
const policyBody = () => {
	try {
		return { policy: readPolicy(), defaults: DEFAULT_POLICY, policyFile: POLICY_FILE };
	} catch (error) {
		return { policy: DEFAULT_POLICY, defaults: DEFAULT_POLICY, policyFile: POLICY_FILE, error: error.message };
	}
};

const testGitlab = async () => {
	const user = await api.Users.showCurrentUser();
	return { ok: true, username: user.username };
};

// La URL lleva un token aleatorio y se comprueba Host contra DNS rebinding.
const startAdminPanel = async () => {
	if (running) {
		running.touch();
		return running.url;
	}

	const token = crypto.randomBytes(24).toString("hex");
	const base = `/${token}`;
	let timer;
	let expectedHost;

	const server = http.createServer(async (req, res) => {
		running?.touch();

		if (req.headers.host !== expectedHost) return send(res, 403, { error: "Host no permitido" });

		const { pathname } = new URL(req.url, "http://127.0.0.1");
		if (pathname !== base && !pathname.startsWith(`${base}/`)) return send(res, 404, { error: "No encontrado" });
		const route = pathname.slice(base.length) || "/";

		try {
			if (req.method === "GET" && route === "/") {
				return send(res, 200, renderPage(), "text/html; charset=utf-8");
			}
			if (req.method === "GET" && route === "/api/settings") {
				return send(res, 200, stateBody());
			}
			if (req.method === "GET" && route === "/api/policy") {
				return send(res, 200, policyBody());
			}
			if (req.method === "POST" && ["/api/settings", "/api/test", "/api/policy"].includes(route)) {
				if (!String(req.headers["content-type"]).startsWith("application/json")) {
					return send(res, 415, { error: "Se esperaba application/json" });
				}
				const body = await readJson(req);

				if (route === "/api/settings") {
					return send(res, 200, await saveSettingsBody(body.values ?? {}, Array.isArray(body.clear) ? body.clear : []));
				}
				if (route === "/api/policy") {
					savePolicy(body.policy);
					return send(res, 200, policyBody());
				}
				return send(res, 200, await testGitlab());
			}
			return send(res, 404, { error: "No encontrado" });
		} catch (error) {
			return send(res, 400, { error: error?.cause?.description ?? error.message ?? "Error desconocido" });
		}
	});

	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", resolve);
	});

	const { port } = server.address();
	expectedHost = `127.0.0.1:${port}`;

	const touch = () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			server.close();
			running = null;
		}, IDLE_MS);
		timer.unref();
	};

	running = { url: `http://${expectedHost}${base}/`, touch };
	touch();
	server.unref();

	return running.url;
};

module.exports = startAdminPanel;
