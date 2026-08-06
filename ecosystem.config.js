// Configuración de pm2. Los secretos NO viven aquí: se leen del .env de la raíz
// (gitignored), del que .env.example es la plantilla. Este fichero sí se versiona.
const path = require('path');

const { parsed = {} } = require('dotenv').config({
	path: path.join(__dirname, '.env'),
});

module.exports = {
	apps: [
		{
			name: 'deckhand',
			script: 'server.js',
			cwd: __dirname,
			// Volcamos el .env en el env de pm2 para que `pm2 reload --update-env`
			// recoja los cambios sin tener que reiniciar el proceso a mano.
			env: parsed,
			watch: false,
			autorestart: true,
			max_memory_restart: '300M',
		},
	],
};
