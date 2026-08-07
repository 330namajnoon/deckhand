const jsonResult = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const textResult = (text) => ({ content: [{ type: "text", text }] });
// Bloque de contenido "resource" del SDK MCP, para devolver binarios (p. ej. un .zip) como blob base64.
const resourceResult = (uri, mimeType, buffer) => ({
	content: [{ type: "resource", resource: { uri, mimeType, blob: buffer.toString("base64") } }],
});

module.exports = { jsonResult, textResult, resourceResult };
