const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');

const { differenceWith } = require('lodash');
const { destinationDir, destinationDirAbsolutePath, mapAge, shouldScrape, gameType, maxNumberOfMaps } = require('./constants');
const { downloadAndUnzipMaps } = require('./unzip-maps');
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

  const spinner = ora({ text: 'Getting maps', spinner:'material'}).start();
  const { filesWrote, filesErrored } = await axios
    .get(searchUrl)
    .then((res) => {
      console.log(chalk.green(`Got ${res.data.length} maps. Searching destination folder for existing maps (by name)...`));

      const destinationDirFilelist = fs.readdirSync(destinationDirAbsolutePath);
      const newMaps = differenceWith(
        maxNumberOfMaps && maxNumberOfMaps !== -1 ? res.data.slice(0, maxNumberOfMaps) : res.data,
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

      return downloadAndUnzipMaps(newMaps, spinner);
    })
    spinner.stop();

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
