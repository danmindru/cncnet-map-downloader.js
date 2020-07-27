const path = require('path');

const shouldScrape = process.env.FORCE_SCAPE;
const gameType = process.env.GAME_TYPE || 'yr';
const mapAge = Number(process.env.MAP_AGE) || 0;
const destinationDir = process.env.DESTINATION_DIR || 'cncnet-maps';
const delayBetweenRequests = Number(process.env.REQUEST_DELAY) || 500;
const maxNumberOfMaps = Number(process.env.MAX_NUMBER_OF_MAPS) || -1;
const debug = process.env.DEBUG;
const cwd = process.env.RUN_UNPACKAGED ? process.cwd() : path.dirname(process.execPath);
const destinationDirAbsolutePath = path.resolve(cwd, destinationDir);

module.exports = {
  shouldScrape,
  gameType,
  mapAge,
  destinationDir,
  delayBetweenRequests,
  maxNumberOfMaps,
  debug,
  cwd,
  destinationDirAbsolutePath,
};
