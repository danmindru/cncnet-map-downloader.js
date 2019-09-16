const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');

const { differenceWith } = require('lodash');
const { destinationDir, destinationDirAbsolutePath, mapAge, shouldScrape, gameType } = require('./constants');
const { unzipMaps } = require('./unzip-maps');
const { removeDuplicates } = require('./remove-duplicates');

if (!fs.existsSync(destinationDirAbsolutePath)) {
  fs.mkdirSync(destinationDirAbsolutePath);
  process.stdout.write(chalk.gray(`Destination dir does not exist. Creating ${destinationDir} in ${destinationDirAbsolutePath}`));
} else {
  process.stdout.write(chalk.gray(`Using existing destination dir: ${destinationDir}`));
}

/**
 * Lists all maps then downloads them & unzips into the dir of choice.
 * A delay between requests is made to be nice :-)
 */
const main = async () => {
  const searchUrl = mapAge
    ? `https://mapdb.cncnet.org/search-json.php?game=${gameType}&age=${mapAge}`
    : `https://mapdb.cncnet.org/search-json.php?game=${gameType}`;

  if (shouldScrape) {
    console.warn(chalk.yellow('Scraping not implemented. Using cncnet search-json url to list all maps.'));
  }

  console.log(`\nGettings maps from ${chalk.underline(searchUrl)}...\n`);

  const { filesWrote, filesErrored } = await axios
    .get(searchUrl)
    .then((res) => {
      console.log(chalk.green(`Got ${res.data.length} maps. Searching destination folder for existing maps (by name)...`));

      const destinationDirFilelist = fs.readdirSync(destinationDirAbsolutePath);
      const newMaps = differenceWith(
        res.data,
        destinationDirFilelist,
        (mapObject, fileName) => fileName.indexOf(mapObject.hash) !== -1
      );
      const filesSkipped = res.data.length - newMaps.length;

      if (filesSkipped >= 0) {
        if(filesSkipped === res.data.length) {
          console.log(chalk.gray(`\nNo new files to download (skipped ${filesSkipped} map names that already exist in the target directory)`));
        } else {
          console.log(chalk.yellow(`\nSkipped ${filesSkipped} map names that already exist in the target directory.`));
        }
      }

      return unzipMaps(newMaps);
    });

    const filesDedupedNumber = await removeDuplicates(destinationDirAbsolutePath);

    console.log(`\nDone.

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
