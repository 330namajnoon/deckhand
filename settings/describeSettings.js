const SETTINGS = require("./definitions");
const readSettings = require("./readSettings");

const describeSettings = () => {
	const saved = readSettings();

	return SETTINGS.map(({ key, label, description, sensitive, required }) => {
		const fromFile = saved[key] !== undefined && saved[key] !== "";
		const fromEnv = !fromFile && Boolean(process.env[key]);
		const value = fromFile ? saved[key] : process.env[key] || "";

		return {
			key,
			label,
			description,
			sensitive,
			required,
			isSet: fromFile || fromEnv,
			source: fromFile ? "panel" : fromEnv ? "env" : null,
			...(sensitive ? {} : { value }),
		};
	});
};

module.exports = describeSettings;
