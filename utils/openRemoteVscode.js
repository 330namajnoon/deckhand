const openInBrowser = require("./openInBrowser");

// Por la URL vscode:// en vez del comando `code`: no necesita estar en el PATH (en Windows es code.cmd).
async function openRemoteVscode(user, hostName, port, route = "/var/www/") {
  const folder = route.startsWith("/") ? route : `/${route}`;
  const uri = `vscode://vscode-remote/ssh-remote+${user}@${hostName}:${port}${folder}`;
  console.log(`Abriendo VS Code en ${uri}...`);

  if (!(await openInBrowser(uri))) {
    throw new Error("No se ha podido abrir VS Code: comprueba que está instalado con la extensión Remote-SSH");
  }
  return { success: true, uri };
}

module.exports = openRemoteVscode;
