const { createController } = require("sm-express-server");
const { listRepositories } = require("../utils");

// La llamada a GitLab es lenta y la lista cambia poco: se cachea en memoria.
const CACHE_TTL = 5 * 60 * 1000;

let cache = null;
let cachedAt = 0;

const getRepositoriesController = createController(async (req, res) => {
	if (!cache || Date.now() - cachedAt > CACHE_TTL) {
		cache = await listRepositories();
		cachedAt = Date.now();
	}

	res.send(cache);
});

module.exports = getRepositoriesController;
