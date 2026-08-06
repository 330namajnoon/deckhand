const jwksRsa = require("jwks-rsa");

// Cliente JWKS singleton (con cache y rate-limit), mismo patrón que
// gitlab/index.js: se construye una vez a partir del env y se reutiliza.
// Solo existe si MCP_AUTH_JWKS_URI está configurado; si el auth-server
// entrega una clave pública fija en vez de JWKS, ver MCP_AUTH_PUBLIC_KEY en
// tokenVerifier.js.
const jwksUri = process.env.MCP_AUTH_JWKS_URI;

const client = jwksUri
	? jwksRsa({
			jwksUri,
			cache: true,
			rateLimit: true,
	  })
	: null;

module.exports = client;
