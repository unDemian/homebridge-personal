
/**
 * Internal dependencies
 */
import { PLATFORM_NAME } from './settings';
import { Platform } from './platform';

export = (api) => {
  api.registerPlatform(PLATFORM_NAME, Platform);
};
