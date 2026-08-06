// Error con un status HTTP asociado, usado por services/ para que tanto los
// controllers REST como los tools MCP puedan mapear el mismo fallo a su forma
// de respuesta (res.status(n) vs {isError:true}) sin repetir la lógica.
// alreadyLogged=true por defecto: cubre tanto los fallos "esperados" (404/409/400,
// que los controllers nunca han loggeado) como los que el propio service ya
// loggea con logError antes de lanzar (p. ej. el 502 de deleteDeploy) — en
// ambos casos ni withErrorLogging ni withToolErrorLogging deben loggear de nuevo.
class HttpError extends Error {
	constructor(message, status, { alreadyLogged = true } = {}) {
		super(message);
		this.status = status;
		this.alreadyLogged = alreadyLogged;
	}
}

module.exports = HttpError;
