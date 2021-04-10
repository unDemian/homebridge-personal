/**
 * External dependencies
 */
import { Service, PlatformAccessory } from 'homebridge';

/**
 * Internal dependencies
 */
import { Platform } from '../../platform';
import { Hub } from '../hub';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export default class Accessory {
  constructor(
    public readonly platform: Platform,
    public readonly hub: Hub,
    public readonly accessory: PlatformAccessory,
  ) {
    const device = accessory.context.device;
    // set generic accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, device.info.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, device.info.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.info.id)
      .setCharacteristic(this.platform.Characteristic.Name, device.name);
  }

  log = (...args) =>
    this.platform.log.info(this.hub.name, this.accessory.context.device.name, '\x1b[35m[INFO]\x1b[0m', ...args);

  error = (...args) => this.platform.log.error(this.hub.name, this.accessory.context.device.name, ...args);
}
