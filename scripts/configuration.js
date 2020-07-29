const path = require('path');

const cwd = process.env.RUN_UNPACKAGED ? process.cwd() : path.dirname(process.execPath);
const destinationDir = process.env.DESTINATION_DIR || 'cncnet-maps';

const DEFAULTS = {
  shouldScrape: process.env.FORCE_SCAPE,
  shouldSortInDirectories: process.env.SKIP_SORTING !== 'false' && process.env.SKIP_SORTING !== false,
  gameType: process.env.GAME_TYPE || 'yr',
  mapAge: Number(process.env.MAP_AGE) || 0,
  delayBetweenRequests: Number(process.env.REQUEST_DELAY) || 500,
  maxNumberOfMaps: Number(process.env.MAX_NUMBER_OF_MAPS) || -1,
  debug: process.env.DEBUG,
  cwd,
  destinationDir,
  destinationDirAbsolutePath: path.resolve(cwd, destinationDir),
};

let config = { ...DEFAULTS };

/**
 * Get default (initial) config.
 */
const getDefaultConfig = () => {
  return { ...DEFAULTS };
};

/**
 * Get current config.
 */
const getConfig = () => {
  return { ...config };
};

/**
 * Sets a property of the config to the provided value.
 *
 * @param {string} property
 * @param {string|number|boolean} value
 */
const setConfigProperty = (property, value) => {
  config = { ...config, [property]: value };
  return config;
};

module.exports = {
  getDefaultConfig,
  getConfig,
  setConfigProperty,
};
