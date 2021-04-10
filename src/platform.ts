/**
 * External dependencies
 */
import {
  API,
  APIEvent,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
  AccessoryConfig,
} from 'homebridge';

/**
 * Internal dependencies
 */
import { Harmony } from './harmony';
import { Broadlink } from './broadlink';

/**
 * Types
 */
export interface PersonalAccessory extends AccessoryConfig {
  name: string;
  type: string;
  info: {
    id: string;
    model: string;
    manufacturer: string;
  };
  external: {
    name: string;
    id: string | number;
  };
  settings: Record<string, unknown>;
  commands: Record<string, unknown>;
}

export interface PersonalConfig extends PlatformConfig {
  harmony: {
    settings: {
      port: number;
      allowList: string;
    };
    accessories: PersonalAccessory[];
  };
  broadlink: {
    accessories: PersonalAccessory[];
  };
}

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class Platform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  public harmony;
  public broadlink: Broadlink;

  constructor(public readonly log: Logger, public readonly config: PersonalConfig, public readonly api: API) {
    this.log.info('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      // hubs
      this.harmony = new Harmony(this);
      this.broadlink = new Broadlink(this);
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
}
