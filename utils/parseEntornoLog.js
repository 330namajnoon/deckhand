function parseEntornoLog(log) {
  const getValue = (label) => {
    const regex = new RegExp(`${label}:\\s*(.+)`);
    const match = log.match(regex);
    return (match ? match[1].trim() : null)?.replace(/\x1B\[[0-9;]*m/g, '');
  };

  return {
    fechaCaducidad: getValue('Fecha caducidad entorno'),
    usuarioSsh: getValue('Usuario SSH entorno'),
    contrasenaSsh: getValue('Contraseña por defecto SSH entorno'),
    servidorSsh: getValue('Servidor SSH entorno'),
    puertoSsh: getValue('Puerto conexión SSH entorno'),
    cadenaConexionSsh: getValue('Cadena conexión SSH entorno'),
    rutaRaiz: getValue('Ruta raíz \\(DocumentRoot\\) entorno'),
    url: getValue('URL entorno'),
    ideKeyXdebug: getValue('IdeKey xDebug entorno'),
  };
}

module.exports = parseEntornoLog;
