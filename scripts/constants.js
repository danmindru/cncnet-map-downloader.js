const path = require('path');

const shouldScrape = process.env.FORCE_SCAPE;
const gameType = process.env.GAME_TYPE || 'yr';
const mapAge = process.env.MAP_AGE || null;
const destinationDir = process.env.DESTINATION_DIR || 'cncnet-maps';
const delayBetweenRequests = process.env.REQUEST_DELAY || 500;
const debug = process.env.DEBUG;
const cwd = process.env.RUN_UNPACKAGED ? process.cwd() : path.dirname(process.execPath);
const destinationDirAbsolutePath = path.resolve(cwd, destinationDir);

module.exports = {
  shouldScrape,
  gameType,
  mapAge,
  destinationDir,
  delayBetweenRequests,
  debug,
  cwd,
  destinationDirAbsolutePath
};
