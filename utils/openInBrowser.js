const { spawn } = require("child_process");

const COMMANDS = {
	darwin: ["open", []],
	win32: ["cmd", ["/c", "start", ""]],
};

const openInBrowser = (url) =>
	new Promise((resolve) => {
		const [command, args] = COMMANDS[process.platform] ?? ["xdg-open", []];
		const child = spawn(command, [...args, url], { stdio: "ignore", detached: true });
		child.on("error", () => resolve(false));
		child.on("spawn", () => {
			child.unref();
			resolve(true);
		});
	});

module.exports = openInBrowser;
