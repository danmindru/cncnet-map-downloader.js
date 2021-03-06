const fs = require('fs');
const path = require('path');
const md5File = require('md5-file');
const chalk = require('chalk');

const { runPromisesWithProgress, replaceLine, getRecursiveFileList } = require('./util');
const { flatten } = require('lodash');
const { getConfig } = require('./configuration');
const { removeFile } = require('./util');

/**
 * Get the size of a file.
 *
 * @param { string } targetDir
 *
 * @return { number }
 */
const getFileSize = (targetDir) => (filePath) =>
  new Promise((resolve, reject) =>
    fs.stat(path.resolve(targetDir, filePath), (error, stats) => {
      if (error) {
        console.error(`Failed to get file size for ${filePath}`, error);
        return reject(null);
      }

      return resolve({ size: stats.size, filePath });
    })
  ).catch((error) => {
    if (getConfig().debug) {
      console.error('Failed to get file size', error);
    }
  });

/**
 * Given a path, removes duplicate files by first checking size, then hash.
 *
 * @param {string} targetDir Target directory to find duplicates in.
 */
const removeDuplicates = async (targetDir) => {
  const targetDirFilelist = (await getRecursiveFileList(targetDir)).filter((filePath) =>
    fs.statSync(path.resolve(targetDir, filePath)).isFile()
  );
  console.log(`\nComparing file sizes...`);

  // Get file sizes, filtering out failed fs.stats
  const fileSizes = await runPromisesWithProgress(
    targetDirFilelist.map(getFileSize(targetDir)),
    'Getting size of files'
  );

  const filesBySize = fileSizes
    .filter((size) => size)
    .reduce((acc, { size, filePath }, index) => {
      replaceLine(`Grouping by size ${index + 1}/${fileSizes.length}...`);
      acc[size] = acc[size] ? [...acc[size], filePath] : [filePath];
      return acc;
    }, {});

  console.log(`\nChecking for duplicates...`);

  // Filter by items with duplicates
  const fileIndexesWithSameSize = Object.keys(filesBySize).filter((key) => {
    const values = filesBySize[key];
    return values.length > 1;
  });

  console.log('Verifying hashes of similarly-sized files...');

  // Filter by items with same checksum
  const fileIndexesWithSameChecksum = fileIndexesWithSameSize.filter(async (key) => {
    const values = filesBySize[key];

    const hashArray = await Promise.all(values.map((filePath) => md5File(path.resolve(targetDir, filePath))));

    return hashArray.every((v) => v === hashArray[0]);
  });

  // Remove duplicates, keeping the first item of the duplicates array
  const fileRemovalPromises = flatten(
    fileIndexesWithSameChecksum.map((key) => {
      const filesToRemove = filesBySize[key].slice(1);

      if (getConfig().debug) {
        console.debug(chalk.green(`\nFound map duplicates for file: ${filesBySize[key][0]}. Will keep only 1 map.`));
        console.debug(chalk.yellow(`Will remove duplicates: ${filesToRemove.map((f) => `\n - ${chalk.bold(f)}`)}`));
      }

      return filesToRemove.map(removeFile(targetDir));
    })
  );

  console.log(`Removing duplicates...`);

  const removalResult = await runPromisesWithProgress(fileRemovalPromises, 'Removing duplicate files');
  return removalResult.filter((resolved) => resolved).length;
};

module.exports = {
  removeDuplicates,
};
