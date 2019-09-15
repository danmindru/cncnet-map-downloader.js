const fs = require('fs');
const path = require('path');
const hasha = require('hasha');
const chalk = require('chalk');

const { flatten } = require('lodash');
const { debug } = require('./constants');

/**
 * Remove a file.
 *
 * @param { string } targetDir
 */
const removeFile = (targetDir) => (filePath) =>
  new Promise((resolve, reject) =>
    fs.unlink(path.resolve(targetDir, filePath), (error) => {
      if (error) {
        console.error(`Failed to remove ${filePath}`, error);
        reject(null);
      }

      resolve(path.resolve(targetDir, filePath));
    })
  );

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
        reject(null);
      }

      resolve({ size: stats.size, filePath });
    })
  );

/**
 * Given a path, removes duplicate files by first checking size, then hash.
 *
 * @param {string} targetDir Target directory to find duplicates in.
 */
const removeDuplicates = async (targetDir) => {
  const targetDirFilelist = fs.readdirSync(targetDir);

  console.log(`\nComparing file sizes...`);

  // Get file sizes, filtering out failed fs.stats
  const fileSizes = await Promise.all(targetDirFilelist.map(getFileSize(targetDir)));
  const filesBySize = fileSizes
    .filter((size) => size)
    .reduce((acc, { size, filePath }) => {
      return { ...acc, [size]: acc[size] ? [...acc[size], filePath] : [filePath] };
    }, {});

  console.log(`Checking for duplicates...`);

  // Filter by items with duplicates
  const fileIndexesWithSameSize = Object.keys(filesBySize).filter((key) => {
    const values = filesBySize[key];
    return values.length > 1;
  });

  // Filter by items with same checksum
  const fileIndexesWithSameChecksum = fileIndexesWithSameSize.filter(async (key) => {
    const values = filesBySize[key];

    const hashArray = await Promise.all(
      values.map((filePath) => hasha.fromFile(path.resolve(targetDir, filePath), { algorithm: 'md5' }))
    );

    return hashArray.every((v) => v === hashArray[0]);
  });

  console.log(`Removing duplicates...`);
  // Remove duplicates, taking the first item of the duplicate array
  const fileRemovalPromises = flatten(
    fileIndexesWithSameChecksum.map((key) => {
      const filesToRemove = filesBySize[key].slice(1);

      if (debug) {
        console.debug(chalk.green(`\nFound map duplicates for file: ${filesBySize[key][0]}. Will keep only 1 map.`));
        console.debug(chalk.yellow(`Removing duplicates: ${filesToRemove.map((f) => `\n - ${chalk.bold(f)}`)}`));
      }

      return filesToRemove.map(removeFile(targetDir));
    })
  );

  const removalResult = await Promise.all(fileRemovalPromises);
  return removalResult.filter((resolved) => resolved).length;
};

module.exports = {
  removeDuplicates
};
