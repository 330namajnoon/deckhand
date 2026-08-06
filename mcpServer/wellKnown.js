const { metadataHandler } = require("@modelcontextprotocol/sdk/server/auth/handlers/metadata.js");

// Protected Resource Metadata (RFC 9728): le dice a un cliente MCP contra qué
// authorization server autenticarse para poder llamar a /mcp, sin que el
// usuario tenga que configurarlo a mano (mismo mecanismo que usan los
// conectores de Gmail/Vercel). Solo publicamos esto — no
// /.well-known/oauth-authorization-server, esa metadata la sirve el propio
// auth-server en su origen (auth.sinul.es), no deckhand.
const resourceUrl = `${process.env.MCP_PUBLIC_URL}/mcp`;

const protectedResourceMetadata = {
	resource: resourceUrl,
	authorization_servers: [process.env.MCP_AUTH_ISSUER],
	scopes_supported: (process.env.MCP_AUTH_REQUIRED_SCOPES || "").split(",").map((s) => s.trim()).filter(Boolean),
	resource_name: "deckhand",
};

// Se sirve tanto en la ruta específica del recurso (la que construye
// getOAuthProtectedResourceMetadataUrl a partir de /mcp, la que de verdad
// buscan los clientes MCP) como en la raíz del .well-known, por compatibilidad
// con clientes que no añaden el path del recurso.
const mountWellKnown = (app) => {
	app.use("/.well-known/oauth-protected-resource/mcp", metadataHandler(protectedResourceMetadata));
	app.use("/.well-known/oauth-protected-resource", metadataHandler(protectedResourceMetadata));
};

module.exports = { mountWellKnown, resourceUrl };
