const readSettings = require("./readSettings");

const getSetting = (key) => {
	const value = readSettings()[key];
	return value === undefined || value === "" ? process.env[key] || "" : value;
};

module.exports = getSetting;
