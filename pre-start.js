//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");
const CRYPTO = require("node:crypto");

// Logs related constants
const LOG_DIR = "logs";

//Conf related constants
const PROPERTIES_FILE = "properties.json";

//Create local logs directory if needed
if (!FS.existsSync(PATH.join(__dirname, LOG_DIR))){
        FS.mkdirSync(PATH.join(__dirname, LOG_DIR));
}

//Generate a new serial if none is found
if (!FS.existsSync(PATH.join(__dirname, PROPERTIES_FILE))){
	var newSerial = "DC" + CRYPTO.randomBytes(6).toString("hex").toUpperCase();
	FS.writeFileSync(PATH.join(__dirname, PROPERTIES_FILE), JSON.stringify({serial: newSerial}));
}
