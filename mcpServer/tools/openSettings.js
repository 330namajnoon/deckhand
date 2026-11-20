const { startAdminPanel } = require("../../adminPanel");
const { openInBrowser } = require("../../utils");
const { textResult } = require("../toolResult");

module.exports = {
	name: "open_settings",
	title: "Abrir los ajustes de deckhand",
	description:
		"Abre en el navegador el panel local para configurar deckhand (URL y token de GitLab, contraseña nueva de los entornos, política de las tools remote_*). Usar cuando falte configuración o el usuario quiera cambiarla. Los valores los mete el usuario en el panel: nunca se los pidas por el chat.",
	inputSchema: {},
	handler: async () => {
		const url = await startAdminPanel();
		const opened = await openInBrowser(url);

		return textResult(
			opened
				? `Panel de ajustes abierto en el navegador: ${url}\nSe cierra solo tras 30 minutos sin uso.`
				: `No se ha podido abrir el navegador. Abre esta URL: ${url}\nSe cierra sola tras 30 minutos sin uso.`
		);
	},
};
