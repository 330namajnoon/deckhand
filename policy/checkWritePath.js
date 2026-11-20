const path = require("path");
const globToRegExp = require("./globToRegExp");

const checkWritePath = (policy, absolutePath, root) => {
	const relative = path.posix.relative(root, absolutePath);
	const insideRoot = !relative.startsWith("..") && !path.posix.isAbsolute(relative);
	const basename = path.posix.basename(absolutePath);

	const hit = policy.writeDenyPaths.find(({ pattern }) => {
		const regex = globToRegExp(pattern);
		if (pattern.startsWith("/")) return regex.test(absolutePath);
		if (!pattern.includes("/")) return regex.test(basename);
		return insideRoot && regex.test(relative);
	});

	return hit ? { allowed: false, reason: `${hit.reason || "Ruta protegida por la política"} (regla: ${hit.pattern})` } : { allowed: true };
};

module.exports = checkWritePath;
