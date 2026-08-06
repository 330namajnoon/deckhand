const jsonResult = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const textResult = (text) => ({ content: [{ type: "text", text }] });

module.exports = { jsonResult, textResult };
