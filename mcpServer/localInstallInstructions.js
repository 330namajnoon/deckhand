// Instrucciones para el agente MCP: cuando el deploy se crea desde el MCP
// (services/createDeploy y services/redeployEntorno llamados con
// remoteInstall: false), deckhand no resuelve el login SSH forzado ni copia
// la clave SSH ni abre VS Code — esos pasos requieren la máquina del propio
// agente, no la de deckhand. Este texto le da al modelo los datos de
// conexión y los comandos exactos para hacerlo él mismo.
const localInstallInstructions = (deploy) => {
	const { usuarioSsh, contrasenaSsh, servidorSsh, puertoSsh, cadenaConexionSsh, rutaRaiz } = deploy;

	return [
		`Este entorno está creado pero le falta el último paso, que hay que hacer en TU máquina (la del agente), no en el servidor de deckhand: el login SSH inicial, copiar tu clave SSH y abrir VS Code.`,
		``,
		`Datos de conexión:`,
		`  usuario: ${usuarioSsh}`,
		`  servidor: ${servidorSsh}`,
		`  puerto: ${puertoSsh}`,
		`  contraseña actual: ${contrasenaSsh}`,
		`  comando SSH: ${cadenaConexionSsh}`,
		`  carpeta remota: ${rutaRaiz}`,
		``,
		`Ejecuta estos pasos tú mismo, en orden:`,
		``,
		`1. Conéctate por SSH: ${cadenaConexionSsh}`,
		`   Es la primera conexión, así que pedirá cambiar la contraseña: introduce la contraseña actual (${contrasenaSsh}) y elige tú una contraseña nueva cualquiera. Si no la pide, pasa al paso 2.`,
		`2. Copia tu clave SSH local al entorno (la usará, por ejemplo, para acceder a GitLab):`,
		`   scp -P ${puertoSsh} ~/.ssh/id_ed25519 ${usuarioSsh}@${servidorSsh}:~/.ssh/id_rsa`,
		`3. Abre el entorno en VS Code (Remote-SSH):`,
		`   code --folder-uri "vscode-remote://ssh-remote+${usuarioSsh}@${servidorSsh}:${puertoSsh}${rutaRaiz}"`,
	].join("\n");
};

module.exports = localInstallInstructions;
