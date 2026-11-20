const { metadataHandler } = require("@modelcontextprotocol/sdk/server/auth/handlers/metadata.js");

// Protected Resource Metadata (RFC 9728): indica al cliente MCP qué authorization server usar.
const resourceUrl = `${process.env.MCP_PUBLIC_URL}/mcp`;

const protectedResourceMetadata = {
	resource: resourceUrl,
	authorization_servers: [process.env.MCP_AUTH_ISSUER],
	scopes_supported: (process.env.MCP_AUTH_REQUIRED_SCOPES || "").split(",").map((s) => s.trim()).filter(Boolean),
	resource_name: "deckhand",
};

// También en la raíz de .well-known, para clientes que no añaden el path del recurso.
const mountWellKnown = (app) => {
	app.use("/.well-known/oauth-protected-resource/mcp", metadataHandler(protectedResourceMetadata));
	app.use("/.well-known/oauth-protected-resource", metadataHandler(protectedResourceMetadata));
};

module.exports = { mountWellKnown, resourceUrl };
