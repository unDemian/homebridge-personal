/**
 * External dependencies
 */
import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

/**
 * Internal dependencies
 */
import { Platform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LedStripAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private state = {
    On: false,
    Hue: -1,
    Saturation: -1,
  };

  private commands = [];

  constructor(
      private readonly platform: Platform,
      private readonly accessory: PlatformAccessory,
  ) {
    // force reset lights
    const turnOff = { command: 'Off', type: 'IRCommand', deviceId: this.accessory.context.device.id };
    this.platform.ws.sendCommand(JSON.stringify(turnOff)).catch(e => this.platform.log.error(e.message));

    this.platform.storage.getItem('ledStripAccessory:on').then( onState => this.state.On = onState );
    this.platform.ws.getDeviceCommands(this.accessory.context.device.id)
      .then(response => this.commands = response).catch(e => this.platform.log.error(e.message));

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setOn.bind(this))
      .on('get', this.getOn.bind(this));

    // register handlers for the Hue Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Hue)
      .on('set', this.setHue.bind(this));

    // register handlers for the Saturation Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Saturation)
      .on('set', this.setSaturation.bind(this));
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.info('setOn', value);

    if ( this.commands.length === 0 ) {
      return;
    }

    let command = { command: 'Off', type: 'IRCommand', deviceId: this.accessory.context.device.id };
    let stateOn = true;

    if ( value ) {
      command = { command: 'On', type: 'IRCommand', deviceId: this.accessory.context.device.id };
      stateOn = false;
    }

    this.platform.storage.setItem('ledStripAccessory:on', stateOn);
    this.platform.ws.sendCommand(JSON.stringify(command)).catch(e => this.platform.log.error(e.message));

    // implement your own code to turn your device on/off
    this.state.On = value as boolean;

    // you must call the callback function
    callback(null);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  getOn(callback: CharacteristicGetCallback) {

    // implement your own code to check if the device is on
    const isOn = this.state.On;

    this.platform.log.info('Get Characteristic On ->', isOn);

    // you must call the callback function
    // the first argument should be null if there were no errors
    // the second argument should be the value to return
    callback(null, isOn);
  }

  setHue(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.info('setHue', value);
    // implement your own code to set the brightness
    this.state.Hue = value as number;

    if ( this.commands.length === 0 ) {
      return;
    }

    let color = 'Light9';

    switch( true ) {
      case this.state.Saturation < 5:
        // white: ignore Hue
        this.state.Saturation = -1;
        color = 'a';
        break;

      case this.state.Hue >= 40 && this.state.Hue < 70:
        // yellow
        color = 'Light7';
        this.platform.log.info('yellow');
        break;

      case ( this.state.Hue >= 0 && this.state.Hue < 40 ) || (this.state.Hue >= 340 && this.state.Hue < 360):
        // red
        color = 'Light1';
        this.platform.log.info('red');
        break;

      case this.state.Hue >= 277 && this.state.Hue < 340:
        // violet
        color = 'Scene1';
        this.platform.log.info('violet');
        break;

      case this.state.Hue >= 164 && this.state.Hue < 277:
        // blue
        color = 'Light10';
        this.platform.log.info('blue');
        break;

      case this.state.Hue >= 70 && this.state.Hue < 164:
        // green
        color = 'Light2';
        this.platform.log.info('green');
        break;
    }

    const command = { command: color, type: 'IRCommand', deviceId: this.accessory.context.device.id };
    this.platform.ws.sendCommand(JSON.stringify(command)).catch(e => this.platform.log.error(e.message));

    // you must call the callback function
    callback(null);
  }

  setSaturation(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.info('setSaturation', value);

    // implement your own code to set the brightness
    this.state.Saturation = value as number;

    // you must call the callback function
    callback(null);
  }
}
