const tools = require("./tools");
const withToolErrorLogging = require("./withToolErrorLogging");
const withEntornoContextNotice = require("./withEntornoContextNotice");

const needsContextNotice = (name) => name.startsWith("remote_") && name !== "remote_load_context";

const registerTools = (server) => {
	tools.forEach(({ name, title, description, inputSchema, annotations, handler }) => {
		const wrapped = needsContextNotice(name) ? withEntornoContextNotice(handler) : handler;
		server.registerTool(name, { title, description, inputSchema, annotations }, withToolErrorLogging(name, wrapped));
	});
};

module.exports = registerTools;
