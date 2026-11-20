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
			// El .env se vuelca en el env de pm2 para que `pm2 reload --update-env` recoja los cambios.
			env: parsed,
			watch: false,
			autorestart: true,
			max_memory_restart: '300M',
		},
	],
};
