/**
 * External dependencies
 */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

/**
 * Internal dependencies
 */
import { PLUGIN_NAME } from '../../settings';
import { Platform } from '../../platform';
import Accessory from '../../base/accessories/accessory';
import { Hub } from '../../base/hub';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export default class TV extends Accessory {
  public tvService: Service;
  public speakerService: Service;

  private state = {
    Active: this.platform.Characteristic.Active.INACTIVE,
    volume: 16,
  };

  constructor(platform: Platform, hub: Hub, accessory: PlatformAccessory) {
    super(platform, hub, accessory);

    const platformService = this.platform.Service.Television;
    const tvService = this.accessory.getService(platformService);
    this.tvService = tvService || this.accessory.addService(platformService);
    this.tvService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.tvService.setCharacteristic(this.platform.Characteristic.ConfiguredName, accessory.context.device.name);
    this.tvService.setCharacteristic(
      this.platform.Characteristic.SleepDiscoveryMode,
      this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
    );
    this.accessory.category = this.platform.api.hap.Categories.TELEVISION;

    this.tvService
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(this.getTvActive)
      .onSet(this.setTvActive);

    // Remote keys
    this.tvService.getCharacteristic(this.platform.Characteristic.RemoteKey).onSet(this.setTvKeys);

    // Speaker
    this.createSpeaker();

    // publish as external accessory to hack the one TV per hub limitation
    this.platform.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
  }

  getTvActive = async () => {
    return this.state.Active;
  };

  setTvActive = async (value: CharacteristicValue) => {
    const {
      context: { device },
    } = this.accessory;
    this.log('setTvActive', value);

    let command = { command: 'PowerOff', type: 'IRCommand', deviceId: device.external.id };
    if (value) {
      command = { command: 'PowerOn', type: 'IRCommand', deviceId: device.external.id };
    }

    this.hub.sendData(command);

    this.state.Active = value as number;
  };

  setTvKeys = async (value: CharacteristicValue) => {
    const {
      context: { device },
    } = this.accessory;
    this.log('setTvKeys', value);
    const command = { command: '', type: 'IRCommand', deviceId: device.external.id };
    switch (value) {
      case this.platform.Characteristic.RemoteKey.ARROW_UP: {
        command.command = 'DirectionUp';
        break;
      }

      case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
        command.command = 'DirectionDown';
        break;
      }

      case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
        command.command = 'DirectionLeft';
        break;
      }

      case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
        command.command = 'DirectionRight';
        break;
      }

      case this.platform.Characteristic.RemoteKey.EXIT: {
        command.command = 'Exit';
        break;
      }

      case this.platform.Characteristic.RemoteKey.SELECT: {
        command.command = 'Select';
        break;
      }

      case this.platform.Characteristic.RemoteKey.BACK: {
        command.command = 'Return';
        break;
      }

      case this.platform.Characteristic.RemoteKey.INFORMATION: {
        command.command = 'Info';
        break;
      }
    }

    this.hub.sendData(command);
  };

  createSpeaker = () => {
    const speakerService = this.accessory.addService(this.platform.Service.TelevisionSpeaker);
    speakerService
      .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
      .setCharacteristic(
        this.platform.Characteristic.VolumeControlType,
        this.platform.Characteristic.VolumeControlType.ABSOLUTE
      );

    // handle volume control
    speakerService
      .getCharacteristic(this.platform.Characteristic.VolumeSelector)
      .onGet(this.getSpeakerVolume)
      .onSet(this.setSpeakerVolume);
  };

  getSpeakerVolume = async () => {
    return this.state.volume;
  };

  setSpeakerVolume = async (value: CharacteristicValue) => {
    const {
      context: { device },
    } = this.accessory;
    this.log('setTvVolume', value);
    const command = { command: 'VolumeUp', type: 'IRCommand', deviceId: device.external.id };
    if (value) {
      command.command = 'VolumeDown';
    }

    this.hub.sendData(command);

    this.state.volume = value as number;
  };
}
