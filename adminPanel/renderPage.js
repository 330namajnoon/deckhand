// Va como string para que entre en bundle/server.js. Peticiones relativas porque la URL base lleva el token.
const renderPage = () => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ajustes de deckhand</title>
<style>
	:root {
		--bg: #f6f6f4; --surface: #ffffff; --text: #1d1d1b; --muted: #66665f;
		--border: #dcdcd6; --accent: #1f5f8b; --accent-text: #ffffff;
		--ok: #1e6b3a; --ok-bg: #e5f3e9; --err: #a02a1d; --err-bg: #fbe9e6;
	}
	@media (prefers-color-scheme: dark) {
		:root {
			--bg: #161615; --surface: #20201e; --text: #ececea; --muted: #a3a39c;
			--border: #3a3a36; --accent: #6bb0e0; --accent-text: #0d1b26;
			--ok: #8fd6a6; --ok-bg: #173323; --err: #f0a196; --err-bg: #3a1c17;
		}
	}
	* { box-sizing: border-box; }
	body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
	main { max-width: 640px; margin: 0 auto; padding: 40px 16px 64px; }
	h1 { font-size: 22px; margin: 0 0 4px; }
	.intro { color: var(--muted); margin: 0 0 28px; }
	code { font-size: 13px; }
	form { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 8px 20px 20px; }
	.field { padding: 16px 0; border-bottom: 1px solid var(--border); }
	.field:last-of-type { border-bottom: 0; }
	label { display: flex; align-items: baseline; gap: 8px; font-weight: 600; }
	.req { color: var(--muted); font-weight: 400; font-size: 13px; }
	.desc { color: var(--muted); font-size: 13px; margin: 2px 0 8px; }
	input[type=text], input[type=password] {
		width: 100%; padding: 9px 11px; font: inherit; color: var(--text);
		background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
	}
	textarea, select {
		width: 100%; padding: 9px 11px; font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--text);
		background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
	}
	select { font: inherit; }
	textarea { min-height: 150px; resize: vertical; }
	h2 { font-size: 18px; margin: 40px 0 4px; }
	input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.meta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 6px; font-size: 13px; color: var(--muted); }
	.meta label { font-weight: 400; gap: 6px; align-items: center; }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
	button { font: inherit; font-weight: 600; padding: 9px 16px; border-radius: 6px; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text); }
	button.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
	button:disabled { opacity: .6; cursor: default; }
	.status { margin-top: 16px; padding: 10px 12px; border-radius: 6px; display: none; }
	.status.ok { display: block; background: var(--ok-bg); color: var(--ok); }
	.status.err { display: block; background: var(--err-bg); color: var(--err); }
	.foot { color: var(--muted); font-size: 13px; margin-top: 20px; word-break: break-all; }
</style>
</head>
<body>
<main>
	<h1>Ajustes de deckhand</h1>
	<p class="intro">Los cambios se aplican al momento, sin reiniciar Claude Code.</p>
	<form id="form" novalidate>
		<div id="fields"></div>
		<div class="actions">
			<button type="submit" class="primary" id="save">Guardar</button>
			<button type="button" id="test">Probar conexión con GitLab</button>
		</div>
		<div id="status" class="status" role="status" aria-live="polite"></div>
	</form>
	<p class="foot" id="foot"></p>

	<h2>Política de las tools remotas</h2>
	<p class="intro">Qué pueden hacer los agentes en los entornos con <code>remote_exec</code>, <code>remote_write_file</code>, <code>remote_edit_file</code> y <code>remote_db_query</code>. Es una red contra errores, no una barrera de seguridad: un comando puede esquivar cualquier patrón.</p>
	<form id="policyForm" novalidate>
		<div class="field">
			<label for="p_database">Base de datos</label>
			<p class="desc">En "Sin acceso" y "Solo lectura" se bloquean los clientes de base de datos y los comandos de Doctrine que la tocan en <code>remote_exec</code>. En "Solo lectura", <code>remote_db_query</code> acepta solo SELECT/SHOW/EXPLAIN/DESCRIBE dentro de una transacción READ ONLY.</p>
			<select id="p_database" name="database">
				<option value="deny">Sin acceso</option>
				<option value="readonly">Solo lectura</option>
				<option value="allow">Acceso completo</option>
			</select>
		</div>
		<div class="field">
			<label for="p_commands">Comandos prohibidos</label>
			<p class="desc">Una regla por línea: una expresión regular (sin distinguir mayúsculas) contra el comando completo y, opcionalmente, <code> # motivo</code> al final.</p>
			<textarea id="p_commands" name="commands" spellcheck="false"></textarea>
		</div>
		<div class="field">
			<label for="p_paths">Rutas donde no se puede escribir</label>
			<p class="desc">Una regla por línea, glob con <code>*</code>, <code>**</code> y <code>?</code>, y opcionalmente <code> # motivo</code>. Sin "/" se compara con el nombre del fichero (<code>.env*</code>); empezando por "/", con la ruta absoluta (<code>/etc/**</code>); el resto, con la ruta relativa a la raíz del proyecto (<code>config/**</code>).</p>
			<textarea id="p_paths" name="paths" spellcheck="false"></textarea>
		</div>
		<div class="field">
			<label for="p_envFiles">Conexión de <code>remote_db_query</code></label>
			<p class="desc">Ficheros (relativos a la raíz del proyecto, separados por comas) donde buscar la URL de la base de datos, y nombre de la variable.</p>
			<input type="text" id="p_envFiles" name="envFiles" autocomplete="off" spellcheck="false">
			<input type="text" id="p_urlVariable" name="urlVariable" aria-label="Variable con la URL de la base de datos" autocomplete="off" spellcheck="false" style="margin-top:8px">
		</div>
		<div class="actions">
			<button type="submit" class="primary" id="policySave">Guardar política</button>
			<button type="button" id="policyDefaults">Rellenar con los valores por defecto</button>
		</div>
		<div id="policyStatus" class="status" role="status" aria-live="polite"></div>
	</form>
	<p class="foot" id="policyFoot"></p>
</main>
<script>
	const fieldsEl = document.getElementById("fields");
	const statusEl = document.getElementById("status");
	const saveBtn = document.getElementById("save");
	const testBtn = document.getElementById("test");

	const showStatus = (kind, text, target = statusEl) => { target.className = "status " + kind; target.textContent = text; };

	const request = async (path, body) => {
		const res = await fetch(path, body === undefined ? {} : {
			method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(data.error || "Error " + res.status);
		return data;
	};

	const el = (tag, props = {}, children = []) => {
		const node = Object.assign(document.createElement(tag), props);
		children.forEach((c) => node.append(c));
		return node;
	};

	const render = ({ settings, configFile }) => {
		fieldsEl.replaceChildren(...settings.map((s) => {
			const id = "f_" + s.key;
			const input = el("input", {
				id, name: s.key, type: s.sensitive ? "password" : "text", autocomplete: "off", spellcheck: false,
				value: s.sensitive ? "" : (s.value || ""),
				placeholder: s.sensitive && s.isSet ? "Guardado. Déjalo vacío para no cambiarlo" : "",
			});
			const meta = el("div", { className: "meta" });
			if (s.source === "env") meta.append(el("span", { textContent: "Valor actual tomado del .env" }));
			if (s.sensitive && s.source === "panel") {
				meta.append(el("label", {}, [el("input", { type: "checkbox", name: "clear", value: s.key }), "Borrar el valor guardado"]));
			}
			return el("div", { className: "field" }, [
				el("label", { htmlFor: id }, [s.label, el("span", { className: "req", textContent: s.required ? "obligatorio" : "opcional" })]),
				el("p", { className: "desc", textContent: s.description }),
				input,
				meta,
			]);
		}));
		document.getElementById("foot").textContent = "Se guardan en " + configFile;
	};

	const load = () => request("api/settings").then(render).catch((e) => showStatus("err", e.message));

	document.getElementById("form").addEventListener("submit", async (event) => {
		event.preventDefault();
		const form = new FormData(event.target);
		const clear = form.getAll("clear");
		const values = {};
		for (const [key, value] of form.entries()) if (key !== "clear") values[key] = value;
		saveBtn.disabled = true;
		try {
			render(await request("api/settings", { values, clear }));
			showStatus("ok", "Ajustes guardados.");
		} catch (e) {
			showStatus("err", e.message);
		} finally {
			saveBtn.disabled = false;
		}
	});

	testBtn.addEventListener("click", async () => {
		testBtn.disabled = true;
		showStatus("ok", "Probando…");
		try {
			const { username } = await request("api/test", {});
			showStatus("ok", "Conexión correcta: has entrado como " + username + ".");
		} catch (e) {
			showStatus("err", "No se ha podido conectar: " + e.message);
		} finally {
			testBtn.disabled = false;
		}
	});

	load();

	// Política: las reglas se editan como "patrón # motivo", una por línea.
	const policyForm = document.getElementById("policyForm");
	const policyStatusEl = document.getElementById("policyStatus");
	const policySaveBtn = document.getElementById("policySave");
	const SEP = " # ";
	let policyDefaults = null;

	const rulesToText = (rules) => rules.map((r) => r.reason ? r.pattern + SEP + r.reason : r.pattern).join("\\n");
	const textToRules = (text) => text.split("\\n").map((line) => line.trim()).filter(Boolean).map((line) => {
		const i = line.lastIndexOf(SEP);
		return i === -1 ? { pattern: line, reason: "" } : { pattern: line.slice(0, i).trim(), reason: line.slice(i + SEP.length).trim() };
	});

	const fillPolicy = (policy) => {
		policyForm.database.value = policy.database;
		policyForm.commands.value = rulesToText(policy.commandDenyPatterns);
		policyForm.paths.value = rulesToText(policy.writeDenyPaths);
		policyForm.envFiles.value = policy.databaseConnection.envFiles.join(", ");
		policyForm.urlVariable.value = policy.databaseConnection.urlVariable;
	};

	const renderPolicy = (data) => {
		policyDefaults = data.defaults;
		fillPolicy(data.policy);
		document.getElementById("policyFoot").textContent = "Se guarda en " + data.policyFile;
		if (data.error) showStatus("err", data.error + " Se muestran los valores por defecto: guarda para corregirlo.", policyStatusEl);
	};

	request("api/policy").then(renderPolicy).catch((e) => showStatus("err", e.message, policyStatusEl));

	document.getElementById("policyDefaults").addEventListener("click", () => {
		if (!policyDefaults) return;
		fillPolicy(policyDefaults);
		showStatus("ok", "Valores por defecto cargados en el formulario. Guarda para aplicarlos.", policyStatusEl);
	});

	policyForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const policy = {
			database: policyForm.database.value,
			commandDenyPatterns: textToRules(policyForm.commands.value),
			writeDenyPaths: textToRules(policyForm.paths.value),
			databaseConnection: {
				envFiles: policyForm.envFiles.value.split(",").map((f) => f.trim()).filter(Boolean),
				urlVariable: policyForm.urlVariable.value.trim(),
			},
		};
		policySaveBtn.disabled = true;
		try {
			renderPolicy(await request("api/policy", { policy }));
			showStatus("ok", "Política guardada. Se aplica en la siguiente llamada.", policyStatusEl);
		} catch (e) {
			showStatus("err", e.message, policyStatusEl);
		} finally {
			policySaveBtn.disabled = false;
		}
	});
</script>
</body>
</html>`;

module.exports = renderPage;
