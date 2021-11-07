/**
 * External dependencies
 */
import broadlinkJS from 'broadlinkjs-rm';

/**
 * Internal dependencies
 */
import { Platform } from '../platform';
import { Hub } from '../base/hub';
import AirConditioner from './accessories/air-conditioner';

export class Broadlink extends Hub {
  constructor(platform: Platform) {
    super(platform);

    this.name = 'BroadLink';
    this.accessoryMapping = {
      'air-conditioner': AirConditioner,
    };

    if (!this.platform.config.broadlink) {
      this.error('broadlink configuration is required');
      return;
    }

    this.discoverHubs();
  }

  discoverHubs = () => {
    this.log('Hub discovery started');

    const broadlink = new broadlinkJS();
    broadlink.discover();
    broadlink.on('deviceReady', this.hubDiscovered);
    broadlink.on('error', this.log);
  };

  hubDiscovered = (hub) => {
    this.log(`Hub discovered ${hub.model} (${hub.type.toString(16)}) at ${hub.host.address}`);
    this.connection = hub;

    this.discoverDevices();
  };

  discoverDevices = () => {
    this.log('Device discovery started');
    if (!this.platform.config.broadlink.accessories) {
      this.error('accessories configuration is required');
      return;
    }

    for (const accessory of this.platform.config.broadlink.accessories) {
      if (!accessory || !accessory.name) {
        this.error('accessory item has no name field');
        return;
      }

      if (accessory.ignore) {
        continue;
      }

      if (!accessory.type) {
        this.error(accessory.name + ' accessory field should be populated');
        return;
      }

      if (!this.accessoryMapping[accessory.type]) {
        this.error(accessory.name + ' is not supported');
        return;
      }

      this.deviceDiscovered(this.transformDevice(accessory));
    }
  };

  getCommands = (deviceId: string): Promise<[]> => {
    return Promise.resolve([]);
  };

  sendData = (data) => {
    const hexDataBuffer = new Buffer(data, 'hex');
    this.connection.sendData(hexDataBuffer, false, data);
  };
}
