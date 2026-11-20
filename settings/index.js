const SETTINGS = require("./definitions");
const CONFIG_FILE = require("./configFile");
const readSettings = require("./readSettings");
const getSetting = require("./getSetting");
const saveSettings = require("./saveSettings");
const describeSettings = require("./describeSettings");

module.exports = { SETTINGS, CONFIG_FILE, readSettings, getSetting, saveSettings, describeSettings };
