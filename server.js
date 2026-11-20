// Debe ir antes que cualquier require propio: gitlab/index.js lee el env al importarse.
require('dotenv').config();

const { Server } = require('sm-express-server');
const router = require('./router');
const bodyParser = require('body-parser');
const path = require('path');
const { logError } = require('./utils');
const { mountMcp } = require('./mcpServer');

process.on('unhandledRejection', (reason) => {
	console.error('❌ Promesa rechazada sin gestionar:', reason);
	logError('unhandledRejection', reason);
});
process.on('uncaughtException', (error) => {
	console.error('❌ Excepción no capturada:', error);
	logError('uncaughtException', error);
});

const port = process.env.PORT || 4000;
// sm-express-server siempre monta express.static: una carpeta inexistente evita servir el repo.
const server = new Server(port, path.join(__dirname, 'static'), [bodyParser.json()], [router], []);

mountMcp(server.app);

server.start(() => {
	console.log(`Server is running on port ${port}`);
})