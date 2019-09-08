const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');

const { destinationDir, destinationDirAbsolutePath, mapAge, shouldScrape, gameType } = require('./constants');
const { unzipMaps } = require('./unzip-maps');

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

  await axios
    .get(searchUrl)
    .then((res) => {
      const destinationDirFilelist = fs.readdirSync(destinationDirAbsolutePath);
      const maps = res.data.filter(filterByExistingMaps(destinationDirFilelist));
      const filesSkipped = res.data.length - maps.length - 1;

      if (filesSkipped > 0) {
        console.log(`\nSkipped ${destinationDirFilelist.length} existing maps.`);
      }

      return unzipMaps(maps);
    })
    .then(({ filesWrote, filesErrored }) => {
      console.log(`Done.

      -  ${chalk.green(`Downloaded & unzipped: ${chalk.bold(filesWrote.length)}`)}
      -  ${
        filesErrored.length
          ? chalk.red(`Failed to download: ${chalk.bold(filesErrored.length)}`)
          : 'All downloads succesfull.'
      }
      `);
    });
};

main();
