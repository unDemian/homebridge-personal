/**
 * External dependencies
 */
import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';

/**
 * Internal dependencies
 */
import { Platform } from '../../platform';
import Accessory from '../../base/accessories/accessory';
import { Hub } from '../../base/hub';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export default class AirConditioner extends Accessory {
  public thermostatService: Service;

  private state = {
    cooling: this.platform.Characteristic.TargetHeatingCoolingState.OFF,
  };

  constructor(platform: Platform, hub: Hub, accessory: PlatformAccessory) {
    super(platform, hub, accessory);

    // Setup Thermostat Service
    const thermostatService = this.accessory.getService(this.platform.Service.Thermostat);
    this.thermostatService = thermostatService || this.accessory.addService(this.platform.Service.Thermostat);

    this.thermostatService.setCharacteristic(this.platform.Characteristic.Name, 'AC');
    this.thermostatService
      .getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .setProps({ validValues: [this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS] })
      .setValue(this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS);

    this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(16);
    this.thermostatService
      .getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .setValue(this.platform.Characteristic.CurrentHeatingCoolingState.OFF);

    this.thermostatService
      .getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .setProps({ minStep: 1, minValue: 16, maxValue: 32 })
      .on('get', this.getTemperature.bind(this))
      .on('set', this.setTemperature.bind(this));

    this.thermostatService
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: [
          this.platform.Characteristic.TargetHeatingCoolingState.OFF,
          this.platform.Characteristic.TargetHeatingCoolingState.COOL,
        ],
      })
      .onGet(this.getCoolingState.bind(this))
      .onSet(this.setCoolingState.bind(this));
  }

  setTemperature(value, callback) {
    this.log('setTemperature', value);
    const {
      context: { device },
    } = this.accessory;

    if (!device.commands[`temperature${value}`]) {
      this.error('Config temperature does not exist');
    }

    this.hub.sendData(device.commands[`temperature${value}`]);

    this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(value);

    // you must call the callback function
    callback(null);
  }

  getTemperature(callback) {
    this.log('getTemperature', callback);
    // you must call the callback function
    callback(null, 0);
  }

  async setCoolingState(value) {
    this.log('setCoolingState', value);
    const {
      context: { device },
    } = this.accessory;

    if (!device.commands['off']) {
      this.error('Config temperature does not exist');
    }

    if (value === this.platform.Characteristic.TargetHeatingCoolingState.OFF) {
      this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature).setValue(16);
      this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(16);
      this.hub.sendData(device.commands['off']);
    } else {
      this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature).setValue(16);
      this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(16);
      this.hub.sendData(device.commands['temperature16']);
    }

    this.state.cooling = value;
  }

  async getCoolingState(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const cooling = this.state.cooling;

    this.platform.log.debug('getCoolingState', cooling);

    return cooling;
  }
}
