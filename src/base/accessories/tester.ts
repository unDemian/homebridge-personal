/**
 * External dependencies
 */
import { Service, PlatformAccessory } from 'homebridge';

/**
 * Internal dependencies
 */
import { Platform } from '../../platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Tester {
  private service: Service;
  private type;
  private name;
  constructor(
      private readonly platform: Platform,
      private readonly accessory: PlatformAccessory,
  ) {
    this.type = this.platform.Service.HumidifierDehumidifier;
    this.name = accessory.context.device.exampleDisplayName;

    const characteristics = [
      this.platform.Characteristic.Active,
      this.platform.Characteristic.LockPhysicalControls,
      this.platform.Characteristic.CurrentHumidifierDehumidifierState,
    ];

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);

    this.service = this.accessory.getService(this.type) || this.accessory.addService(this.type);
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.name);

    for (const characteristic of characteristics) {
      this.service.getCharacteristic(characteristic)
        .on('get', this.get.bind(this))
        .on('set', this.set.bind(this));
    }
  }

  set(value, callback) {
    this.platform.log.info(this.name + ' set');
    // you must call the callback function
    callback(null);
  }

  get(callback) {
    this.platform.log.info(this.name + ' get');
    // you must call the callback function
    callback(null);
  }
}
