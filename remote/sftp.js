const path = require("path");
const getConnection = require("./getConnection");

const call = async (deploy, method, ...args) => {
	const { sftp } = await getConnection(deploy);
	return new Promise((resolve, reject) =>
		sftp[method](...args, (error, result) => (error ? reject(error) : resolve(result)))
	);
};

const stat = (deploy, target) => call(deploy, "stat", target);
const readFile = (deploy, target) => call(deploy, "readFile", target);
const writeFile = (deploy, target, content) => call(deploy, "writeFile", target, content);
const readdir = (deploy, target) => call(deploy, "readdir", target);

const exists = (deploy, target) =>
	stat(deploy, target).then(
		() => true,
		(error) => (error.code === 2 ? false : Promise.reject(error))
	);

const mkdirp = async (deploy, dir) => {
	if (dir === "/" || (await exists(deploy, dir))) return;
	await mkdirp(deploy, path.posix.dirname(dir));
	await call(deploy, "mkdir", dir);
};

module.exports = { stat, readFile, writeFile, readdir, exists, mkdirp };
