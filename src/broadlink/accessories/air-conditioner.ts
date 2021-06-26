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
    temperature: 16,
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
      .onGet(this.getTemperature.bind(this))
      .onSet(this.setTemperature.bind(this));

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

  async setTemperature(value) {
    this.log('setTemperature', value);
    const {
      context: { device },
    } = this.accessory;

    if (!device.commands[`temperature${value}`]) {
      this.error('Config temperature does not exist');
    }

    if ( this.state.cooling === this.platform.Characteristic.TargetHeatingCoolingState.OFF ) {
      this.log('it seems it is off, bail');
      return;
    }

    this.hub.sendData(device.commands[`temperature${value}`]);

    this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(value);
    this.state.temperature = value;
  }

  async getTemperature(): Promise<CharacteristicValue> {
    const temperature = this.state.temperature;

    this.platform.log.debug('getTemperature', temperature);

    return temperature;
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
      if ( this.state.cooling === this.platform.Characteristic.TargetHeatingCoolingState.OFF ) {
        this.log('Already off, bail');
      }
      this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature).setValue(this.state.temperature);
      this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(this.state.temperature);
      this.hub.sendData(device.commands['off']);
    } else {
      if ( this.state.cooling === this.platform.Characteristic.TargetHeatingCoolingState.COOL ) {
        this.log('Already cooling, bail');
      }
      this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature).setValue(this.state.temperature);
      this.thermostatService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setValue(this.state.temperature);
      this.hub.sendData(device.commands['temperature' + this.state.temperature]);
    }

    this.state.cooling = value;
  }

  async getCoolingState(): Promise<CharacteristicValue> {
    const cooling = this.state.cooling;

    this.platform.log.debug('getCoolingState', cooling);

    return cooling;
  }
}
