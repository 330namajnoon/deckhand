const getConnection = require("./getConnection");
const shellQuote = require("./shellQuote");

const MAX_OUTPUT = 100 * 1024;

const collector = () => {
	const chunks = [];
	let size = 0;
	let truncated = false;
	return {
		push(chunk) {
			if (size >= MAX_OUTPUT) {
				truncated = true;
				return;
			}
			const rest = MAX_OUTPUT - size;
			if (chunk.length > rest) truncated = true;
			chunks.push(chunk.subarray(0, rest));
			size += Math.min(chunk.length, rest);
		},
		text() {
			const text = Buffer.concat(chunks).toString("utf8");
			return truncated ? `${text}\n[... salida recortada a ${MAX_OUTPUT / 1024} KB ...]` : text;
		},
	};
};

const execCommand = async (deploy, command, { cwd, timeoutMs, stdin }) => {
	const { client } = await getConnection(deploy);
	const script = `cd ${shellQuote(cwd)} && ${command}`;

	return new Promise((resolve, reject) => {
		client.exec(`bash -c ${shellQuote(script)}`, (error, stream) => {
			if (error) return reject(error);

			const stdout = collector();
			const stderr = collector();
			let timedOut = false;

			const timer = setTimeout(() => {
				timedOut = true;
				stream.signal("KILL");
				stream.close();
			}, timeoutMs);

			stream.on("data", (chunk) => stdout.push(chunk));
			stream.stderr.on("data", (chunk) => stderr.push(chunk));
			stream.on("close", (exitCode, signal) => {
				clearTimeout(timer);
				resolve({
					exitCode: exitCode ?? null,
					signal: signal ?? null,
					timedOut,
					stdout: stdout.text(),
					stderr: stderr.text(),
				});
			});

			if (stdin !== undefined) stream.end(stdin);
			else stream.end();
		});
	});
};

module.exports = execCommand;
