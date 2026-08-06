const { requireMcpAuth } = require("./auth");
const { handlePost, methodNotAllowed } = require("./router");
const { mountWellKnown } = require("./wellKnown");

// Manejadores montados directamente en el path exacto (no vía express.Router()
// con una ruta "/"): así se evita la redirección 301 que Express añade por
// defecto en GET/HEAD cuando el router hijo solo tiene una ruta "/" y la
// petición llega sin la barra final — esa redirección se saltaría requireMcpAuth.
const mountMcp = (app) => {
	// Metadata pública, sin auth: un cliente sin token la necesita para poder
	// descubrir el auth-server antes de tener nada que autenticar.
	mountWellKnown(app);
	app.use("/mcp", requireMcpAuth);
	app.post("/mcp", handlePost);
	app.get("/mcp", methodNotAllowed);
	app.delete("/mcp", methodNotAllowed);
};

module.exports = { mountMcp };
