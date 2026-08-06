const { HttpError } = require("../utils");

const notFoundError = (message) => new HttpError(message, 404);
const validationError = (message) => new HttpError(message, 400);

module.exports = { notFoundError, validationError };
