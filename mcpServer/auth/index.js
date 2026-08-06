const { requireBearerAuth } = require("@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js");
const tokenVerifier = require("./tokenVerifier");

const requiredScopes = (process.env.MCP_AUTH_REQUIRED_SCOPES || "")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

// Incluido en el header WWW-Authenticate de los 401: es el hilo del que tira
// un cliente MCP para descubrir solo, a partir de la URL de /mcp, contra qué
// auth-server autenticarse (ver wellKnown.js).
const resourceMetadataUrl = `${process.env.MCP_PUBLIC_URL}/.well-known/oauth-protected-resource/mcp`;

const requireMcpAuth = requireBearerAuth({ verifier: tokenVerifier, requiredScopes, resourceMetadataUrl });

module.exports = { requireMcpAuth };
