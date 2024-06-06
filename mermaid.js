//Generic module loading
const PATH = require("node:path");
const HAP = require("hap-nodejs");
const SYS_LOGGER = require("@damiencassu/node-syslogger");
const CORE = require("@damiencassu/node-core");

//Custom module loading
const HAP_UTILITIES = require("./custom_modules/hapUtilities");

//Mermaid logging details and setup
const LOG_DIR = "logs";
const LOG_FILE_SYS = "server.log";
var sysLogger = new SYS_LOGGER("debug", PATH.join(__dirname, LOG_DIR, LOG_FILE_SYS));
sysLogger.info("server", "########## Mermaid starting... ##########");

//Mermaid ecosystem
const APP_PACKAGE_JSON = CORE.getAppPackageJson(sysLogger);
const APP_PORT = parseInt(CORE.getAppPort(APP_PACKAGE_JSON, sysLogger));
const PROPERTIES_FILE = "properties.json";
const ACCESSORY_DIR = "accessory";
HAP.HAPStorage.setCustomStoragePath(PATH.join(__dirname, ACCESSORY_DIR));

//HAP main objects definition
const ACCESSORY = HAP.Accessory;
const SERVICE = HAP.Service;
const CHARACTERISTIC = HAP.Characteristic;
const CHARACTERISTIC_EVENT_TYPES = HAP.CharacteristicEventTypes;
//const ACCESSORY_DIR = "persist";

//Mermaid alarm accessory related constants
const MERMAID_UUID = HAP.uuid.generate("mermaid.security.system");
const MERMAID = new ACCESSORY("Mermaid Security System", MERMAID_UUID);
const MANUFACTURER = "Damien CASSU";
const MODEL = "Mermaid Security System";
const FIRMWARE_REVISION = CORE.getAppVersion(APP_PACKAGE_JSON,sysLogger);
var USERNAME = HAP_UTILITIES.getAccessoryUsername(sysLogger);
USERNAME = USERNAME == undefined ? HAP_UTILITIES.generateUsername(sysLogger) : USERNAME;
var PINCODE = CORE.loadConfigFile(PATH.join(__dirname, ACCESSORY_DIR, "AccessoryInfo." + HAP_UTILITIES.convertToFilename(USERNAME) + ".json"));
PINCODE = PINCODE == undefined ? HAP_UTILITIES.generatePincode(sysLogger) : PINCODE.pincode;
const SERIAL_NUMBER = CORE.loadConfigFile(PATH.join(__dirname, PROPERTIES_FILE)).serial;

//Mermaid alarm characterisitcs related constants
const SECURITY_SYSTEM_SERVICE = new SERVICE.SecuritySystem("Mermaid Alarm Dev");
const SECURITY_SYSTEM_CURRENT_STATE_CHARACTERISTIC = SECURITY_SYSTEM_SERVICE.getCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState); 
const SECURITY_SYSTEM_TARGET_STATE_CHARACTERISTIC = SECURITY_SYSTEM_SERVICE.getCharacteristic(CHARACTERISTIC.SecuritySystemTargetState);

//Mermaid alarm service modes
const STAY_ARMED = 0;
const AWAY_ARMED = 1;
const NIGHT_ARMED = 2;
const DISARMED = 3;
const ALARM_TRIGGERED = 4;

//Mermaid initial state
var currentAlarmState = DISARMED;

//Mermaid alarm service event handlers
SECURITY_SYSTEM_CURRENT_STATE_CHARACTERISTIC.on(CHARACTERISTIC_EVENT_TYPES.GET, function(callback){
	sysLogger.debug("mermaid", "Getting security system current state: " + currentAlarmState);
	callback(undefined, currentAlarmState);
});

SECURITY_SYSTEM_TARGET_STATE_CHARACTERISTIC.on(CHARACTERISTIC_EVENT_TYPES.SET, function(value, callback){

	//If target value is STAY_ARMED and current state is AWAY_ARMED then trigger the alarm
	if (value == STAY_ARMED && currentAlarmState == AWAY_ARMED){
		sysLogger.fatal("mermaid", "Trigger signal received while armed");
		sysLogger.fatal("mermaid", "Setting security system current state to ALARM_TRIGGERED");
		currentAlarmState = ALARM_TRIGGERED;
		callback();
		//Broadcast mermaid state to HomeKit
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, ALARM_TRIGGERED);
	//If target value is STAY_ARMED and current state is DISARMED then do nothing
	} else if (value == STAY_ARMED && currentAlarmState == DISARMED){
		sysLogger.debug("mermaid", "Trigger signal received while disarmed - Nothing will be done");
        	callback();
		//Broadcast mermaid state to HomeKit
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, DISARMED);
	//If target value is DISARMED then DISARMED
	} else if (value == DISARMED){
		sysLogger.info("mermaid", "Disarm command received - Disarming...");
		currentAlarmState = DISARMED;
		callback();
		//Broadcast mermaid state to HomeKit
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, DISARMED);
	//If target value is AWAY_ARMED and current state is not ALARM_TRIGGERED than AWAY_ARMED
	} else if (value == AWAY_ARMED && !(currentAlarmState == ALARM_TRIGGERED)){
		sysLogger.info("mermaid", "Arm command received - Arming...");
		currentAlarmState = AWAY_ARMED;
		callback();
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, AWAY_ARMED);
	//Else do nothing
	} else {
		sysLogger.debug("mermaid", "Unconfigured command received - Nothing will be done");
		callback();
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, currentAlarmState);
	}
});

//Mermaid service registration and publication
MERMAID.addService(SECURITY_SYSTEM_SERVICE);
var accessoryInfo = MERMAID.getService(SERVICE.AccessoryInformation);
accessoryInfo.setCharacteristic(CHARACTERISTIC.Manufacturer, MANUFACTURER);
accessoryInfo.setCharacteristic(CHARACTERISTIC.Model, MODEL);
accessoryInfo.setCharacteristic(CHARACTERISTIC.SerialNumber, SERIAL_NUMBER);
accessoryInfo.setCharacteristic(CHARACTERISTIC.FirmwareRevision, FIRMWARE_REVISION);
MERMAID.publish({
	username: USERNAME,
	pincode: PINCODE,
	port: APP_PORT,
	category: HAP.Categories.SECURITY_SYSTEM,
});

sysLogger.info("mermaid", "Mermaid v" + FIRMWARE_REVISION + " started");
sysLogger.info("mermaid", "Listening on port " + APP_PORT);
sysLogger.info("mermaid", "Pincode to pair with HomeKit: " + PINCODE);
