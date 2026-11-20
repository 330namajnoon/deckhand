const path = require("path");

const resolveRemotePath = (deploy, target = ".") => path.posix.resolve(deploy.rutaRaiz || "/root", target);

module.exports = resolveRemotePath;
