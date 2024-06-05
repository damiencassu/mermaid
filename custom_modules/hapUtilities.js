//The hap utilities module offers static funtions to retrieve and generate info about/for configured accessories

//Generic module loading
const FS = require("node:fs");
const CRYPTO = require("node:crypto");

//Program constants
const ACCESSORY_DIR = "./persist";

//Convert an accessory username found in config file name to a MAC address
function convertToUsername(fileusername){

	var username = "";
	for (var i = 0; i < fileusername.length; i++) {
		if ((i > 0) && (i % 2 == 0)) {
			username += ":";
		}
		username += fileusername[i];
	}

	return username.toUpperCase();
}

//Convert an accessory username in a MAC address format to a filename
function convertToFilename(username){

	return username.replaceAll(/":"/, "");
}

//Check synchronously if mermaid accessory is already configured and returns its userid if yes
//Returns mermaid parsed username if found, undefined if not
function getAccessoryUsername(logger){

	if (logger != undefined){
                logger.debug("haputilities", "Getting accessory username");
        }

	try {
		var files = FS.readdirSync(ACCESSORY_DIR);
		for (var i = 0; i < files.length; i++){
		
			if (files[i].startsWith("AccessoryInfo")){

				if (logger != undefined) {
					logger.debug("haputilities", "Accessory username found: " + convertToUsername(files[i].split(".")[1]));
				}
				return convertToUsername(files[i].split(".")[1]);
			}

		}

		if (logger != undefined) {
                	logger.debug("haputilities", "Not accessory file found");
                }

		return undefined

	} catch (err) {

		if (logger != undefined){
			 logger.debug("haputilities", "Error while checking accessory files, " + ACCESSORY_DIR + " not found");
		}

		return undefined;
	}
}

//Create a new accessory username in MAC format
function generateUsername(logger){
	
	return convertToUsername(CRYPTO.randomBytes(6).toString("hex"));
}

//Export section
module.exports.getAccessoryUsername = getAccessoryUsername;
module.exports.generateUsername = generateUsername;

