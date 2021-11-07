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
export default class AVDenon extends Accessory {
  public tvService: Service;
  public speakerService: Service;

  private state = {
    Active: this.platform.Characteristic.Active.INACTIVE,
    Input: 9,
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

    // Inputs
    this.createTvInputs();
    this.tvService
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onGet(this.getTvInput)
      .onSet(this.setTvInput);

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

  createTvInputs = () => {
    // HDMI 1 Input Source
    const cable = this.accessory.addService(this.platform.Service.InputSource, 'cable', 'Cable');
    cable
      .setCharacteristic(this.platform.Characteristic.Identifier, 1)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Cable')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(cable);

    // HDMI 2 Input Source
    const dvd = this.accessory.addService(this.platform.Service.InputSource, 'dvd', 'DVD');
    dvd
      .setCharacteristic(this.platform.Characteristic.Identifier, 2)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'DVD')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(dvd);

    // HDMI 3 Input Source
    const fm = this.accessory.addService(this.platform.Service.InputSource, 'fm', 'FM');
    fm.setCharacteristic(this.platform.Characteristic.Identifier, 3)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'FM')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(fm);

    // HDMI 4 Input Source
    const bluray = this.accessory.addService(this.platform.Service.InputSource, 'blu', 'Blu-ray');
    bluray
      .setCharacteristic(this.platform.Characteristic.Identifier, 4)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Blu-ray')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(bluray);

    // HDMI 4 Input Source
    const game = this.accessory.addService(this.platform.Service.InputSource, 'game', 'Game');
    game
      .setCharacteristic(this.platform.Characteristic.Identifier, 5)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Game')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(game);

    // HDMI 5 Input Source
    const am = this.accessory.addService(this.platform.Service.InputSource, 'am', 'AM');
    am.setCharacteristic(this.platform.Characteristic.Identifier, 6)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'AM')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(am);

    // HDMI 6 Input Source
    const media = this.accessory.addService(this.platform.Service.InputSource, 'media', 'Media');
    media
      .setCharacteristic(this.platform.Characteristic.Identifier, 7)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Media')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(media);

    // HDMI 7 Input Source
    const usb = this.accessory.addService(this.platform.Service.InputSource, 'usb', 'USB');
    usb
      .setCharacteristic(this.platform.Characteristic.Identifier, 8)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'USB')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(usb);

    // HDMI 8 Input Source
    const tv = this.accessory.addService(this.platform.Service.InputSource, 'tv', 'Tv Audio');
    tv.setCharacteristic(this.platform.Characteristic.Identifier, 9)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'TV')
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );
    this.tvService.addLinkedService(tv);
  };

  getTvInput = async () => {
    return this.state.Input;
  };

  setTvInput = async (value: CharacteristicValue) => {
    const {
      context: { device },
    } = this.accessory;
    this.log('setTvInput', value);
    const command = { command: 'PowerOff', type: 'IRCommand', deviceId: device.external.id };
    switch (value) {
      case 1:
        command.command = 'InputCbl/Sat';
        break;

      case 2:
        command.command = 'InputDvd/Blu-ray';
        break;

      case 3:
        command.command = 'InputFm';
        break;

      case 4:
        command.command = 'InputBlu-ray';
        break;

      case 5:
        command.command = 'InputGame';
        break;

      case 6:
        command.command = 'InputAm';
        break;

      case 7:
        command.command = 'InputMediaPlayer';
        break;

      case 8:
        command.command = 'InputUsb';
        break;

      case 9:
        command.command = 'InputTvAudio';
        break;

      case 10:
        command.command = 'InputTvAudio';
        break;
    }

    this.hub.sendData(command);

    this.state.Input = value as number;
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

      case this.platform.Characteristic.RemoteKey.SELECT: {
        command.command = 'Enter';
        break;
      }

      case this.platform.Characteristic.RemoteKey.BACK: {
        command.command = 'Back';
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
