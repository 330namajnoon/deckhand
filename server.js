// Debe ir antes que cualquier require propio: gitlab/index.js lee GITLAB_HOST y
// GITLAB_TOKEN al importarse. Bajo pm2 el env ya viene puesto y dotenv no lo pisa.
require('dotenv').config();

const { Server } = require('sm-express-server');
const router = require('./router');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { logError } = require('./utils');
const { mountMcp } = require('./mcpServer');

// Última red de seguridad: errores que nadie ha capturado quedan registrados
// en database/errors.log antes de que el proceso siga (o muera bajo pm2).
process.on('unhandledRejection', (reason) => {
	console.error('❌ Promesa rechazada sin gestionar:', reason);
	logError('unhandledRejection', reason);
});
process.on('uncaughtException', (error) => {
	console.error('❌ Excepción no capturada:', error);
	logError('uncaughtException', error);
});

const port = process.env.PORT || 4000;
const server = new Server(port, "./", [bodyParser.json()], [router], []);

// Sirve el build del front (public/dist) en /dist, con fallback a index.html
// para que las rutas de react-router funcionen al recargar la página.
const distDir = path.join(__dirname, 'public', 'dist');
server.app.use('/dist', express.static(distDir));
server.app.get('/dist/*', (_req, res) => {
	res.sendFile(path.join(distDir, 'index.html'));
});

// Servidor MCP: expone las mismas operaciones que la REST API como tools
// para agentes de IA, autenticado con Bearer JWT contra el auth-server
// (ver mcp/auth/).
mountMcp(server.app);

server.start(() => {
	console.log(`Server is running on port ${port}`);
})