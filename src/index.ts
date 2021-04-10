/**
 * Internal dependencies
 */
import { PLATFORM_NAME } from './settings';
import { Platform } from './platform';
// Fix typing
// import {API} from "homebridge";

export = (api) => {
  api.registerPlatform(PLATFORM_NAME, Platform);
};
