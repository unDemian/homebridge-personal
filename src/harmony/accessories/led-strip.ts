/**
 * External dependencies
 */
import {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
  CharacteristicGetCallback,
} from 'homebridge';

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
export default class LedStrip extends Accessory {
  public lightService: Service;

  private state = {
    On: false,
    Hue: -1,
    Saturation: -1,
  };

  constructor(platform: Platform, hub: Hub, accessory: PlatformAccessory) {
    super(platform, hub, accessory);

    this.initialState();

    // Setup Light service
    const lightService = this.accessory.getService(this.platform.Service.Lightbulb);
    this.lightService = lightService || this.accessory.addService(this.platform.Service.Lightbulb);
    this.lightService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    this.lightService
      .getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setOn.bind(this));

    this.lightService.getCharacteristic(this.platform.Characteristic.Hue).on('set', this.setHue.bind(this));

    this.lightService
      .getCharacteristic(this.platform.Characteristic.Saturation)
      .on('set', this.setSaturation.bind(this));
  }

  initialState() {
    const {
      context: { device },
    } = this.accessory;
    // force turnoff
    const turnOff = { command: 'Off', type: 'IRCommand', deviceId: device.external.id };
    this.hub.sendData(turnOff);
  }

  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const {
      context: { device },
    } = this.accessory;
    this.log('setOn', value);

    let command = { command: 'Off', type: 'IRCommand', deviceId: device.external.id };
    if (value) {
      command = { command: 'On', type: 'IRCommand', deviceId: device.external.id };
    }

    this.hub.sendData(command);

    // implement your own code to turn your device on/off
    this.state.On = value as boolean;

    // you must call the callback function
    callback(null);
  }

  setHue(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const {
      context: { device },
    } = this.accessory;
    this.log('setHue', value);
    // implement your own code to set the brightness
    this.state.Hue = value as number;

    let color = 'Light9';

    switch (true) {
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

      case (this.state.Hue >= 0 && this.state.Hue < 40) || (this.state.Hue >= 340 && this.state.Hue < 360):
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

    const command = { command: color, type: 'IRCommand', deviceId: device.external.id };
    this.hub.sendData(command);

    // you must call the callback function
    callback(null);
  }

  setSaturation(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.log('setSaturation', value);

    // implement your own code to set the brightness
    this.state.Saturation = value as number;

    // you must call the callback function
    callback(null);
  }
}
