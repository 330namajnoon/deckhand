const jsonResult = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const textResult = (text) => ({ content: [{ type: "text", text }] });
const resourceResult = (uri, mimeType, buffer) => ({
	content: [{ type: "resource", resource: { uri, mimeType, blob: buffer.toString("base64") } }],
});

module.exports = { jsonResult, textResult, resourceResult };
