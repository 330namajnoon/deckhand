// Imports `@ruta` de un CLAUDE.md, como los resuelve Claude Code: fuera de bloques y spans de código,
// y solo lo que parece una ruta (con "/" o "."), para no confundirlos con menciones (@usuario).
const findImports = (markdown) => {
	const text = markdown
		.replace(/\r\n/g, "\n")
		.replace(/^(```|~~~)[\s\S]*?^\1/gm, "")
		.replace(/`[^`\n]*`/g, "");

	const found = new Set();
	for (const match of text.matchAll(/(?:^|\s)@((?:~\/|\.{1,2}\/|\/)?[\w.\-/]+)/g)) {
		const target = match[1].replace(/[.,;:)]+$/, "");
		if (/[/.]/.test(target)) found.add(target);
	}
	return [...found];
};

module.exports = findImports;
