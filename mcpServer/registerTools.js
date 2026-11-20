const tools = require("./tools");
const withToolErrorLogging = require("./withToolErrorLogging");

const registerTools = (server) => {
	tools.forEach(({ name, title, description, inputSchema, annotations, handler }) => {
		server.registerTool(name, { title, description, inputSchema, annotations }, withToolErrorLogging(name, handler));
	});
};

module.exports = registerTools;
