/**
 * Extrae los datos del entorno del log del job deploy_workers (la sección
 * de "Clave: valor" que va entre las líneas de asteriscos).
 *
 * @param {string} log - Texto completo del log del job.
 * @returns {{
 *   fechaCaducidad: string,
 *   usuarioSsh: string,
 *   contrasenaSsh: string,
 *   servidorSsh: string,
 *   puertoSsh: string,
 *   cadenaConexionSsh: string,
 *   rutaRaiz: string,
 *   url: string,
 *   ideKeyXdebug: string
 * }} Datos del entorno; los campos que no aparezcan en el log quedan undefined.
 */
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
