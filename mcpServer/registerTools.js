const tools = require("./tools");
const withToolErrorLogging = require("./withToolErrorLogging");

const registerTools = (server) => {
	tools.forEach(({ name, title, description, inputSchema, handler }) => {
		server.registerTool(name, { title, description, inputSchema }, withToolErrorLogging(name, handler));
	});
};

module.exports = registerTools;
