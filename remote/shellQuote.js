// Comillas simples de shell POSIX: el valor llega tal cual, sin expandir nada.
const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

module.exports = shellQuote;
