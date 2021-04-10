/**
 * Internal dependencies
 */
import { PLATFORM_NAME, PLUGIN_NAME } from '../settings';
import { PersonalAccessory, Platform } from '../platform';

export abstract class Hub {
  public name: string;
  public accessoryMapping: { [key: string]: any };
  public connection;

  protected constructor(protected readonly platform: Platform) {}

  abstract discoverHubs(): void;
  abstract hubDiscovered(hub): void;
  abstract discoverDevices(): void;
  abstract sendData(data): void;

  devicesDiscovered = (devices) => {
    return devices;
  };

  deviceDiscovered = (device) => {
    this.log('Device discovered', device.name);
    this.registerDevice(device);
  };

  transformDevice = (device, extra = {}): PersonalAccessory => {
    return { ...device, ...extra };
  };

  registerDevice = (device) => {
    const deviceClass = this.accessoryMapping[device.type];

    if (!deviceClass) {
      return this.error('Unsupported device type ' + device.type);
    }

    // generate a unique id for the accessory this should be generated from
    // something globally unique, but constant, for example, the device serial
    // number or MAC address
    const uuid = this.platform.api.hap.uuid.generate(device.info.id);

    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    const existingAccessory = this.platform.accessories.find((accessory) => accessory.UUID === uuid);

    if (existingAccessory) {
      // the accessory already exists
      if (device) {
        this.log('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);
        new deviceClass(this.platform, this, existingAccessory);

        // update accessory cache with any changes to the accessory details and information
        this.platform.api.updatePlatformAccessories([existingAccessory]);
      } else if (!device) {
        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        this.platform.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        this.log('Removing existing accessory from cache:', existingAccessory.displayName);
      }
    } else {
      // the accessory does not yet exist, so we need to create it
      this.log('Adding new accessory:', device.name);

      // create a new accessory
      const accessory = new this.platform.api.platformAccessory(device.name, uuid);

      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context.device = device;

      new deviceClass(this.platform, this, accessory);

      // link the accessory to your platform
      this.platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  };

  log = (...args) => this.platform.log.info(this.name, '\x1b[35m[INFO]\x1b[0m', ...args);
  error = (...args) => this.platform.log.error(this.name, ...args);
}
