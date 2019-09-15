const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');

const { destinationDir, debug, destinationDirAbsolutePath, mapAge, shouldScrape, gameType } = require('./constants');
const { unzipMaps } = require('./unzip-maps');
const { removeDuplicates } = require('./remove-duplicates');

if (!fs.existsSync(destinationDirAbsolutePath)) {
  fs.mkdirSync(destinationDirAbsolutePath);
  process.stdout.write(`Destination dir does not exist. Creating ${destinationDir} in ${destinationDirAbsolutePath}`);
} else {
  process.stdout.write(`Using existing destination dir: ${destinationDir}`);
}

/**
 * Filters an array of maps by maps already present in the 'file list'.
 *
 * @param { Array<string> } destinationDirFilelist
 */
const filterByExistingMaps = (destinationDirFilelist) => ({ hash }) =>
  !destinationDirFilelist.some((fileName) => {
    const matches = fileName.match(new RegExp(`{{(${hash})}}`, 'gi'));

    if (matches) {
      // If file matches and, presumably, has all the content written, skip it.
      const stats = fs.statSync(`${destinationDirAbsolutePath}/${fileName}`);
      const fileSizeInBytes = stats.size;
      return fileSizeInBytes > 0;
    }
  });

/**
 * Lists all maps then downloads them & unzips into the dir of choice.
 * A delay between requests is made to be nice :-)
 */
const main = async () => {
  const searchUrl = mapAge
    ? `https://mapdb.cncnet.org/search-json.php?game=${gameType}&age=${mapAge}`
    : `https://mapdb.cncnet.org/search-json.php?game=${gameType}`;

  if (shouldScrape) {
    console.warn('Scarping not implemented. Using cncnet search-json url to list all maps.');
  }

  if (debug) {
    console.log(`\nGettings maps from ${searchUrl}\n`);
  }

  const { filesWrote, filesErrored } = await axios
    .get(searchUrl)
    .then((res) => {
      const destinationDirFilelist = fs.readdirSync(destinationDirAbsolutePath);
      const maps = res.data.filter(filterByExistingMaps(destinationDirFilelist)).slice(0, 5);
      const filesSkipped = res.data.length - maps.length - 1;

      if (filesSkipped >= 0) {
        console.log(`\nSkipped ${destinationDirFilelist.length} existing maps.`);
      }

      return unzipMaps(maps);
    })

    const filesDedupedNumber = await removeDuplicates(destinationDirAbsolutePath);

    console.log(`Done.

    -  ${chalk.green(`Downloaded & unzipped: ${chalk.bold(filesWrote.length)}`)}
    -  ${
          filesErrored.length
            ? chalk.red(`Failed to download: ${chalk.bold(filesErrored.length)}`)
            : 'All downloads successful.'
        }
    -  ${
          filesDedupedNumber
            ? chalk.yellow(`Removed ${filesDedupedNumber} files that appeared to be duplicates.`)
            : 'No duplicates found.'
        }
    `);
};

main();
