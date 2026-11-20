const { spawn } = require("child_process");

function openRemoteVscode(user, hostName, port, route = "/var/www/") {
  const host = `${hostName}:${port}`;
  const uri = `vscode-remote://ssh-remote+${user}@${host}${route}`;
  console.log(`Abriendo VS Code en ${uri}...`);

  return new Promise((resolve, reject) => {
    // Sin heredar stdio: en el MCP por stdio, stdin/stdout son el canal del protocolo.
    const child = spawn("code", ["--folder-uri", uri], { stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ success: true, uri });
      else reject(new Error(`code ha terminado con código ${code}`));
    });
  });
}

module.exports = openRemoteVscode;
