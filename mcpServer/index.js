const { requireMcpAuth } = require("./auth");
const { handlePost, methodNotAllowed } = require("./router");
const { mountWellKnown } = require("./wellKnown");

// Rutas exactas, sin express.Router(): su redirección 301 en GET/HEAD se saltaría requireMcpAuth.
const mountMcp = (app) => {
	// Pública: un cliente sin token la necesita para descubrir el auth-server.
	mountWellKnown(app);
	app.use("/mcp", requireMcpAuth);
	app.post("/mcp", handlePost);
	app.get("/mcp", methodNotAllowed);
	app.delete("/mcp", methodNotAllowed);
};

module.exports = { mountMcp };
