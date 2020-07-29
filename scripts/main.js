const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const prompts = require('prompts');

const { getConfig, setConfigProperty } = require('./configuration');
const { getMaps } = require('./get-maps');
const { removeDuplicates } = require('./remove-duplicates');
const { sortMaps } = require('./sort-maps');
const { unsortMaps } = require('./unsort-maps');
const { deleteEmptyDirectories } = require('./delete-empty-directories');

/**
 * Main entry point.
 * Prompts for options, gets maps, sorts, removes duplicates and displays stats.
 */
const main = async () => {
  const { shouldConfigure } = await prompts([
    {
      type: 'confirm',
      name: 'shouldConfigure',
      message: `Would you like to configure some options first? 'No' will start downloading using defaults.`,
    },
  ]);

  if (shouldConfigure) {
    const { gameType, shouldSortInDirectories, destinationDir, maxNumberOfMaps } = await prompts([
      {
        type: 'select',
        name: 'gameType',
        message: 'What would you like to get maps for?',
        choices: [
          { title: "Red Alert 2 Yuri's Revenge (yr)", value: 'yr' },
          { title: 'Red Alert (ra)', value: 'ra' },
          { title: 'Tiberian Sun (ts)', value: 'ts' },
          { title: 'Tiberian Dawn (td)', value: 'td' },
          { title: 'Dune 2000 (d2)', value: 'd2' },
          { title: 'Dawn of the Tiberium Age (dta)', value: 'dta' },
        ],
        initial: 0,
      },
      {
        type: 'confirm',
        name: 'shouldSortInDirectories',
        message: `Should the maps be sorted in directories by name? (a-z, 0-9)`,
      },
      {
        type: 'text',
        name: 'destinationDir',
        message: `In which directory should the maps be saved?`,
        initial: 'cncnet-maps',
      },
      {
        type: 'confirm',
        name: 'maxMaps',
        message: `Would you like to limit the maximum amount of downloaded maps?`,
      },
      {
        type: (prev) => (prev === true ? 'number' : null),
        name: 'maxNumberOfMaps',
        message: `What's the maximum amount of maps to download?`,
        initial: 1000,
      },
    ]);

    setConfigProperty('shouldSortInDirectories', shouldSortInDirectories);
    setConfigProperty('gameType', gameType);
    setConfigProperty('destinationDir', destinationDir);
    if (maxNumberOfMaps) {
      setConfigProperty('maxNumberOfMaps', maxNumberOfMaps);
    }
  }

  const { destinationDirAbsolutePath, destinationDir, shouldSortInDirectories, debug } = getConfig();

  if (!fs.existsSync(destinationDirAbsolutePath)) {
    fs.mkdirSync(destinationDirAbsolutePath);
    process.stdout.write(
      chalk.gray(`Destination dir does not exist. Creating ${destinationDir} in ${destinationDirAbsolutePath}`)
    );
  } else {
    process.stdout.write(chalk.gray(`Using existing destination dir: ${destinationDir}`));
  }

  const spinner = ora({ text: 'Getting maps', spinner: 'material' });
  const { filesErrored, filesWrote, numberOfFilesSkipped } = await getMaps(spinner);

  spinner.text = 'Removing duplicates';
  const filesDedupedNumber = await removeDuplicates(destinationDirAbsolutePath);

  if (shouldSortInDirectories) {
    spinner.text = 'Sorting maps';
    await sortMaps(destinationDirAbsolutePath);
  } else {
    spinner.text = 'Un-sorting maps';
    await unsortMaps(destinationDirAbsolutePath);
  }

  await deleteEmptyDirectories(destinationDirAbsolutePath);

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
