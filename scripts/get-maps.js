const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');

const { differenceWith } = require('lodash');
const {
  destinationDir,
  destinationDirAbsolutePath,
  mapAge,
  shouldScrape,
  shouldSortInDirectories,
  gameType,
  maxNumberOfMaps,
  debug,
} = require('./constants');
const { downloadAndUnzipMaps } = require('./unzip-maps');
const { removeDuplicates } = require('./remove-duplicates');
const { sortMaps } = require('./sort-maps');
const { getRecursiveFileList } = require('./util');

if (!fs.existsSync(destinationDirAbsolutePath)) {
  fs.mkdirSync(destinationDirAbsolutePath);
  process.stdout.write(
    chalk.gray(`Destination dir does not exist. Creating ${destinationDir} in ${destinationDirAbsolutePath}`)
  );
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

  console.clear(); // Clear previous output.
  console.log(`\nGettings maps from ${chalk.underline(searchUrl)}...`);

  const spinner = ora({ text: 'Getting maps', spinner: 'material' });
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

    if (numberOfFilesSkipped >= 0) {
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

    spinner.start();
    return downloadAndUnzipMaps(newMaps, numberOfFilesSkipped, spinner);
  });

  spinner.text = 'Removing duplicates';
  const filesDedupedNumber = await removeDuplicates(destinationDirAbsolutePath);

  if (shouldSortInDirectories) {
    spinner.text = 'Sorting maps';
    await sortMaps(destinationDirAbsolutePath);
  }

  spinner.stop();

  if (!debug) {
    console.clear(); // Clear previous output.
  }
  console.log(`\nDone. Here's the executive summary:
    -  ${chalk.green(`Downloaded & unzipped: ${chalk.bold(filesWrote.length)}`)}
    -  ${
      filesErrored.length
        ? chalk.red(`Failed to download: ${chalk.bold(filesErrored.length)}`)
        : chalk.green('All downloads successful.')
    }
    -  ${
      numberOfFilesSkipped
        ? chalk.yellow(`Skipped ${numberOfFilesSkipped} files that were previously downloaded.`)
        : 'No files skipped.'
    }
    -  ${
      filesDedupedNumber
        ? chalk.yellow(`Removed ${filesDedupedNumber} files that appeared to be duplicates.`)
        : 'No duplicates found.'
    }
    `);
};

main();
