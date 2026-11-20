// alreadyLogged por defecto: los fallos esperados no se loggean y los demás ya los loggea el service.
class HttpError extends Error {
	constructor(message, status, { alreadyLogged = true } = {}) {
		super(message);
		this.status = status;
		this.alreadyLogged = alreadyLogged;
	}
}

module.exports = HttpError;
