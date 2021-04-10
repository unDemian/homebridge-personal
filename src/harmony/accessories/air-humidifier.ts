/**
 * External dependencies
 */
import {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
  CharacteristicGetCallback,
} from "homebridge";

/**
 * Internal dependencies
 */
import { Platform } from "../../platform";
import Accessory from "../../base/accessories/accessory";
import { Hub } from "../../base/hub";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export default class AirHumidifier extends Accessory {
  public humidifierService: Service;
  public lightService: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private state = {
    On: false,
    // Mode: this.platform.Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING,
    // Power: this.platform.Characteristic.SwingMode.SWING_DISABLED,
    // Color: this.platform.Characteristic.RotationSpeed,
  };

  constructor(platform: Platform, hub: Hub, accessory: PlatformAccessory) {
    super(platform, hub, accessory);

    // Setup Humidifier Service.
    const humidifierService = this.accessory.getService(this.platform.Service.HumidifierDehumidifier);
    this.humidifierService =
      humidifierService || this.accessory.addService(this.platform.Service.HumidifierDehumidifier);
    this.humidifierService.setCharacteristic(this.platform.Characteristic.Name, "Purifier");

    this.humidifierService
      .getCharacteristic(this.platform.Characteristic.Active)
      .on("get", this.getOn.bind(this))
      .on("set", this.setOn.bind(this));
    //
    // this.humidifierService
    //   .getCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState)
    //   .setValue(this.platform.Characteristic.CurrentHumidifierDehumidifierState.INACTIVE);
    //
    // this.humidifierService
    //   .getCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState)
    //   .setProps({
    //     validValues: [this.platform.Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER],
    //   })
    //   .on("get", this.getOn.bind(this))
    //   .on("set", this.setOn.bind(this));
  }

  getOn(callback: CharacteristicGetCallback) {
    // implement your own code to check if the device is on
    const isOn = this.state.On;

    this.log("getOn", isOn);

    // you must call the callback function
    // the first argument should be null if there were no errors
    // the second argument should be the value to return
    callback(null, isOn);
  }

  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const {
      context: { device },
    } = this.accessory;
    this.log("setOn", value);

    const command = { command: "PowerToggle", type: "IRCommand", deviceId: device.external.id };
    this.hub.sendData(command);

    // implement your own code to turn your device on/off
    this.state.On = value as boolean;

    // you must call the callback function
    callback(null);
  }
}