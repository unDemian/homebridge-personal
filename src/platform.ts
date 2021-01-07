/**
 * External dependencies
 */
import { API, APIEvent, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import HarmonyHubDiscover from 'harmonyhubjs-discover';
import HarmonyWebSocket from 'harmony-websocket';
import storage from 'node-persist';

/**
 * Internal dependencies
 */
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { LedStripAccessory } from './led-strip-accessory';


/**
 * Types
 */
interface Config extends PlatformConfig {
  port: number;
  accessList: string;
}

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class Platform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public ws;
  public storage;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: Config,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.setup();
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  setup = () => {
    storage.init().catch(e => this.log.error(e.message));
    this.ws = new HarmonyWebSocket();
    this.storage = storage;
  };

  devicesDiscovered = ( devices ) => {
    this.log.info('Devices discovered');

    if ( ! this.config.accessList ) {
      return this.log.error('accessList parameter is missing');
    }

    const accessList = this.config.accessList.split(',');

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of devices) {
      if ( ! accessList.includes( device.label ) ) {
        continue;
      }

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.id);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        if (device) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          switch( device.type ) {
            case 'LightController':
              new LedStripAccessory(this, existingAccessory);
              break;
          }

          // update accessory cache with any changes to the accessory details and information
          this.api.updatePlatformAccessories([existingAccessory]);
        } else if (!device) {
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        }
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.label);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.label, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        switch( device.type ) {
          case 'LightController':
            new LedStripAccessory(this, accessory);
            break;
        }

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  };

  hubDiscovered = ( hub ) => {
    this.log.info('Hub discovered');
    this.ws.connect(hub.ip)
      .then(() => this.ws.getDevices())
      .then(this.devicesDiscovered)
      .catch(e => this.log.error(e.message));
  };

  discoverDevices() {
    if ( ! this.config.port ) {
      return this.log.error('port parameter is missing');
    }

    const discover = new HarmonyHubDiscover(this.config.port);

    discover.on('online', this.hubDiscovered);
    discover.start();
  }
}
