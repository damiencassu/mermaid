//Generic module loading
const PATH = require("node:path");
const HAP = require("hap-nodejs");
const SYS_LOGGER = require("@damiencassu/node-syslogger");

//HAP main objects definition
const ACCESSORY = HAP.Accessory;
const SERVICE = HAP.Service;
const CHARACTERISTIC = HAP.Characteristic;
const CHARACTERISTIC_EVENT_TYPES = HAP.CharacteristicEventTypes;

//Mermaid alarm accessory related constants
const MERMAID_UUID = HAP.uuid.generate("mermaid.alarm.dev");
const MERMAID = new ACCESSORY("Mermaid Dev", MERMAID_UUID);

//Mermaid alarm info
const SECURITY_SYSTEM_INFO = new SERVICE.AccessoryInformation();
SECURITY_SYSTEM_INFO.setCharacteristic(CHARACTERISTIC.Manufacturer, "Damien CASSU");
SECURITY_SYSTEM_INFO.setCharacteristic(CHARACTERISTIC.Model, "Mermaid Security System");
SECURITY_SYSTEM_INFO.setCharacteristic(CHARACTERISTIC.SerialNumber, "007");
SECURITY_SYSTEM_INFO.setCharacteristic(CHARACTERISTIC.FirmwareRevision, "1.0.0");

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

//Mermaid logging details and setup
const LOG_DIR = "logs";
const LOG_FILE_SYS = "server.log";
var sysLogger = new SYS_LOGGER("debug", PATH.join(__dirname, LOG_DIR, LOG_FILE_SYS));

//Mermaid initial state
var currentAlarmState = DISARMED;

//Mermaid alarm service event handlers
SECURITY_SYSTEM_CURRENT_STATE_CHARACTERISTIC.on(CHARACTERISTIC_EVENT_TYPES.GET, function(callback){
	sysLogger.debug("MERMAID", "Getting security system current state: " + currentAlarmState);
	callback(undefined, currentAlarmState);
});

SECURITY_SYSTEM_TARGET_STATE_CHARACTERISTIC.on(CHARACTERISTIC_EVENT_TYPES.SET, function(value, callback){

	//If target value is STAY_ARMED and current state is AWAY_ARMED then trigger the alarm
	if (value == STAY_ARMED && currentAlarmState == AWAY_ARMED){
		sysLogger.fatal("MERMAID", "Trigger signal received while armed");
		sysLogger.fatal("MERMAID", "Setting security system current state to ALARM_TRIGGERED");
		currentAlarmState = ALARM_TRIGGERED;
		callback();
		//Broadcast mermaid state to HomeKit
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, ALARM_TRIGGERED);
	//If target value is STAY_ARMED and current state is DISARMED then do nothing
	} else if (value == STAY_ARMED && currentAlarmState == DISARMED){
		sysLogger.debug("MERMAID", "Trigger signal received while disarmed - Nothing will be done");
        	callback();
		//Broadcast mermaid state to HomeKit
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, DISARMED);
	//If target value is DISARMED then DISARMED
	} else if (value == DISARMED){
		sysLogger.info("MERMAID", "Disarm command received - Disarming...");
		currentAlarmState = DISARMED;
		callback();
		//Broadcast mermaid state to HomeKit
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, DISARMED);
	//If target value is AWAY_ARMED and current state is not ALARM_TRIGGERED than AWAY_ARMED
	} else if (value == AWAY_ARMED && !(currentAlarmState == ALARM_TRIGGERED)){
		sysLogger.info("MERMAID", "Arm command received - Arming...");
		currentAlarmState = AWAY_ARMED;
		callback();
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, AWAY_ARMED);
	//Else do nothing
	} else {
		sysLogger.debug("MERMAID", "Unconfigured command received - Nothing will be done");
		callback();
		SECURITY_SYSTEM_SERVICE.updateCharacteristic(CHARACTERISTIC.SecuritySystemCurrentState, currentAlarmState);
	}
});

//Mermaid service registration and publication
MERMAID.addService(SECURITY_SYSTEM_SERVICE);
MERMAID.services[0] = SECURITY_SYSTEM_INFO;
MERMAID.publish({
	username: "17:51:07:F4:BC:8A",
	pincode: "678-90-876",
	port: 47129,
	category: HAP.Categories.SECURITY_SYSTEM,
});
