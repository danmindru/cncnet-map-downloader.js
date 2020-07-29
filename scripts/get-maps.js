const axios = require('axios');
const chalk = require('chalk');

const { differenceWith } = require('lodash');
const { getConfig } = require('./configuration');
const { downloadAndUnzipMaps } = require('./unzip-maps');
const { getRecursiveFileList } = require('./util');

/**
 * Gets maps from available search urls, alternatively scarping if no api exists.
 *
 * @param { Object } [spinner] Ora spinner instance used to display progress.
 */
const getMaps = async (spinner) => {
  const { destinationDirAbsolutePath, mapAge, shouldScrape, gameType, maxNumberOfMaps } = getConfig();

  const searchUrl = mapAge
    ? `https://mapdb.cncnet.org/search-json.php?game=${gameType}&age=${mapAge}`
    : `https://mapdb.cncnet.org/search-json.php?game=${gameType}`;

  if (shouldScrape) {
    console.warn(chalk.yellow('Scraping not implemented. Using cncnet search-json url to list all maps.'));
  }

  console.log(`\nGettings maps from ${chalk.underline(searchUrl)}...`);

  const { filesWrote, filesErrored, numberOfFilesSkipped } = await axios.get(searchUrl).then(async (res) => {
    const destinationDirFilelist = await getRecursiveFileList(destinationDirAbsolutePath);
    const mapsWithLimitApplied =
      maxNumberOfMaps && maxNumberOfMaps !== -1 ? res.data.slice(0, maxNumberOfMaps) : res.data;
    const newMaps = differenceWith(
      mapsWithLimitApplied,
      destinationDirFilelist,
      (mapObject, fileName) => fileName.indexOf(mapObject.hash) !== -1
    );
    const numberOfFilesSkipped = mapsWithLimitApplied.length - newMaps.length;

    console.log(
      chalk.green(
        `\nGot ${mapsWithLimitApplied.length} maps. Searching destination folder for existing maps (by name)...`
      )
    );

    if (numberOfFilesSkipped > 0) {
      if (numberOfFilesSkipped === mapsWithLimitApplied.length) {
        console.log(
          chalk.gray(
            `\nNo new files to download (skipped ${numberOfFilesSkipped} map names that already exist in the target directory).\n`
          )
        );
      } else {
        console.log(
          chalk.yellow(`\nSkipped ${numberOfFilesSkipped} map names that already exist in the target directory.\n`)
        );
      }
    }

    if (spinner) {
      spinner.start();
    }
    return downloadAndUnzipMaps(newMaps, numberOfFilesSkipped, spinner);
  });

  return {
    filesWrote,
    filesErrored,
    numberOfFilesSkipped,
  };
};

module.exports = {
  getMaps,
};
