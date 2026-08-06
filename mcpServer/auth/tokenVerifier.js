const jwt = require("jsonwebtoken");
const { InvalidTokenError } = require("@modelcontextprotocol/sdk/server/auth/errors.js");
const jwksClient = require("./jwksClient");

const algorithms = (process.env.MCP_AUTH_ALGORITHMS || "RS256").split(",").map((a) => a.trim());

const getSigningKey = (header, callback) => {
	if (!jwksClient) {
		return callback(new Error("MCP_AUTH_JWKS_URI no está configurado"));
	}
	jwksClient.getSigningKey(header.kid, (error, key) => {
		if (error) return callback(error);
		callback(null, key.getPublicKey());
	});
};

// Verifica el JWT emitido por el auth-server: firma (vía JWKS, o
// MCP_AUTH_PUBLIC_KEY como clave fija si el auth-server no expone JWKS),
// issuer, audience y algoritmo permitido. Claims confirmados contra el
// auth-server real (oidc-provider, ver lib/models/formats/jwt.js): siempre
// `client_id` (nunca `azp`) y `scope` como string separado por espacios.
const verifyAccessToken = (token) =>
	new Promise((resolve, reject) => {
		const getKey = process.env.MCP_AUTH_PUBLIC_KEY
			? (_header, callback) => callback(null, process.env.MCP_AUTH_PUBLIC_KEY)
			: getSigningKey;

		jwt.verify(
			token,
			getKey,
			{
				algorithms,
				issuer: process.env.MCP_AUTH_ISSUER || undefined,
				audience: process.env.MCP_AUTH_AUDIENCE || undefined,
			},
			(error, claims) => {
				if (error) {
					return reject(new InvalidTokenError(error.message));
				}

				resolve({
					token,
					clientId: claims.client_id ?? claims.sub,
					scopes: (claims.scope || "").split(" ").filter(Boolean),
					expiresAt: claims.exp,
					extra: { claims },
				});
			}
		);
	});

module.exports = { verifyAccessToken };
