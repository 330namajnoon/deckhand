const jwksRsa = require("jwks-rsa");

const jwksUri = process.env.MCP_AUTH_JWKS_URI;

const client = jwksUri
	? jwksRsa({
			jwksUri,
			cache: true,
			rateLimit: true,
	  })
	: null;

module.exports = client;
