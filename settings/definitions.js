// Los `sensitive` nunca se devuelven al navegador, solo si están puestos.
const SETTINGS = [
	{
		key: "GITLAB_HOST",
		label: "URL de GitLab",
		description: "URL de tu instancia de GitLab, por ejemplo https://gitlab.tuempresa.com",
		sensitive: false,
		required: true,
	},
	{
		key: "GITLAB_TOKEN",
		label: "Token de GitLab",
		description: "Personal Access Token de GitLab con scope api.",
		sensitive: true,
		required: true,
	},
	{
		key: "ENTORNO_NEW_PASSWORD",
		label: "Contraseña nueva de los entornos",
		description: "Se fija en el primer login SSH de un entorno, cuando el servidor obliga a cambiar la contraseña.",
		sensitive: true,
		required: false,
	},
	{
		key: "ENTORNO_NEW_PASSWORD_CRM",
		label: "Contraseña nueva de los entornos de CRM",
		description:
			"Igual que la anterior, para los entornos de proyectos de CRM, cuya política de contraseñas es más estricta y rechaza la de los demás. Si está vacía, se usa la anterior.",
		sensitive: true,
		required: false,
	},
];

module.exports = SETTINGS;
