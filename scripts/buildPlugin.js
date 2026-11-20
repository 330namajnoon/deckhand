const path = require("path");
const esbuild = require("esbuild");

const root = path.join(__dirname, "..");

esbuild
	.build({
		entryPoints: [path.join(root, "mcpServer", "stdio.js")],
		outfile: path.join(root, "bundle", "server.js"),
		bundle: true,
		platform: "node",
		target: "node22.13",
		format: "cjs",
		// cpu-features y el binding nativo de ssh2 son opcionales: ssh2 usa su implementación en JS.
		external: ["node:sqlite", "cpu-features", "*.node"],
		legalComments: "none",
		logLevel: "info",
	})
	.catch(() => process.exit(1));
