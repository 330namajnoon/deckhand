const { requireBearerAuth } = require("@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js");
const tokenVerifier = require("./tokenVerifier");

const requiredScopes = (process.env.MCP_AUTH_REQUIRED_SCOPES || "")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

// Va en el WWW-Authenticate de los 401: así descubre el cliente MCP el auth-server.
const resourceMetadataUrl = `${process.env.MCP_PUBLIC_URL}/.well-known/oauth-protected-resource/mcp`;

const requireMcpAuth = requireBearerAuth({ verifier: tokenVerifier, requiredScopes, resourceMetadataUrl });

module.exports = { requireMcpAuth };
