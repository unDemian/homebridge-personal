/**
 * External dependencies
 */
import HarmonyHubDiscover from 'harmonyhubjs-discover';
import HarmonyWebSocket from 'harmony-websocket';

/**
 * Internal dependencies
 */
import LedStrip from '../harmony/accessories/led-strip';
import AirHumidifier from '../harmony/accessories/air-humidifier';
import { Platform } from '../platform';
import { Hub } from '../base/hub';

export class Harmony extends Hub {
  constructor(platform: Platform) {
    super(platform);

    this.name = 'Harmony';
    this.accessoryMapping = {
      'light-controller': LedStrip,
      'air-humidifer': AirHumidifier,
    };

    if (!this.platform.config.harmony) {
      this.error('harmony configuration is required');
      return;
    }

    this.discoverHubs();
  }

  discoverHubs = () => {
    if (!this.platform.config.harmony.settings.port) {
      return this.error('port parameter is missing');
    }

    this.log('Hub discovery started');

    const discover = new HarmonyHubDiscover(this.platform.config.harmony.settings.port);
    discover.on('online', this.hubDiscovered);
    discover.on('offline', (hub) => {
      // Triggered when a hub disappeared
      this.log('lost ' + hub.ip);
    });

    discover.on('update', (hubs) => {
      // Combines the online & update events by returning an array with all known
      // hubs for ease of use.
      const knownHubIps = hubs.reduce((prev, hub) => {
        return prev + (prev.length > 0 ? ', ' : '') + hub.ip;
      }, '');

      this.log('known ips: ' + knownHubIps);
    });
    discover.start();
  };

  hubDiscovered = (hub) => {
    this.log(`Hub discovered ${hub.ip}`);

    if ( ! hub || ! hub.id ) {
      this.error('Discovered hub malformed' + JSON.stringify(hub));
      return;
    }

    this.connection = hub;

    this.discoverDevices();
  };

  discoverDevices = () => {
    this.log('Device discovery started');
    if (!this.platform.config.harmony.accessories) {
      this.error('accessories configuration is required');
      return;
    }

    this.connection.ws = new HarmonyWebSocket();
    this.connection.ws
      .connect(this.connection.ip)
      .then(() => {
        return this.connection.ws.getDevices();
      })
      .then((devices) => this.devicesDiscovered(devices))
      .catch((e) => this.error(e.message));
  };

  devicesDiscovered = (devices) => {
    this.log('Devices discovered.');

    for (const accessory of this.platform.config.harmony.accessories) {
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

      // loop over the discovered ones
      let matchedDevice = false;
      for (const discoveredDevice of devices) {
        if (discoveredDevice.label === accessory.external.name) {
          matchedDevice = discoveredDevice;
        }
      }

      if (matchedDevice) {
        this.deviceDiscovered(this.transformDevice(accessory, matchedDevice));
      } else {
        this.error(accessory.name + ' not found.');
      }
    }
  };

  transformDevice = (accessory, discoveredDevice) => {
    return {
      ...accessory,
      external: {
        name: discoveredDevice.label,
        id: discoveredDevice.id,
      },
    };
  };

  getCommands = (deviceId) => {
    return this.connection.ws.getDeviceCommands(deviceId);
  };

  sendData = (data) => {
    const command = JSON.stringify(data);
    this.connection.ws
      .sendCommand(command)
      .then(() => ({}), this.error)
      .catch((e) => this.error(e.message));
  };
}
