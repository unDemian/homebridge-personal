/**
 * External dependencies
 */
import { Service, PlatformAccessory } from 'homebridge';

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

    this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(0);
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
      .on('get', this.getCoolingState.bind(this))
      .on('set', this.setCoolingState.bind(this));
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

  setCoolingState(value, callback) {
    this.log('setCoolingState', value);
    const {
      context: { device },
    } = this.accessory;

    if (!device.commands['off']) {
      this.error('Config temperature does not exist');
    }

    if (value === this.platform.Characteristic.TargetHeatingCoolingState.OFF) {
      this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature).setValue(0);
      this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(0);
      this.hub.sendData(device.commands['off']);
    } else {
      this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature).setValue(16);
      this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(16);
      this.hub.sendData(device.commands['temperature16']);
    }

    // you must call the callback function
    callback(null);
  }

  getCoolingState(callback) {
    this.log('getCoolingState', callback);
    // you must call the callback function
    callback(null, this.platform.Characteristic.TargetHeatingCoolingState.OFF);
  }
}
