const path = require('path');
const fs = require('fs');

const { debug } = require('./constants');

/**
 * Given a path, sorts files in directories by their first letter.
 * File names that don't match 0-9, a-z are left in place.
 *
 * @param {string} targetDir Target directory to sort files in.
 */
const sortMaps = async (targetDir) => {
  console.log(`\nSorting maps...`);

  const targetDirFilelist = fs
    .readdirSync(targetDir)
    .filter((filePath) => fs.statSync(path.resolve(targetDir, filePath)).isFile());

  targetDirFilelist.map(async (filePath) => {
    const firstChar = filePath.slice(0, 1).toLowerCase();
    const isAlphaNumeric = firstChar.match(/^[a-zA-Z0-9]/gm);

    if (isAlphaNumeric) {
      try {
        const destinationDirAbsolutePath = path.resolve(targetDir, firstChar);
        if (!fs.existsSync(destinationDirAbsolutePath)) {
          fs.mkdirSync(destinationDirAbsolutePath);
        }

        await moveFile(path.resolve(targetDir, filePath), path.resolve(targetDir, firstChar, filePath));
      } catch (error) {
        if (debug) {
          console.error('Failed to move file', error);
        }
      }
    }
  });
};

/**
 * Moves a file from a path to another
 *
 * @param {string} fromPath
 * @param {string} toPath
 */
const moveFile = (fromPath, toPath) =>
  new Promise((resolve, reject) => {
    fs.rename(fromPath, toPath, (error) => {
      if (error) {
        if (debug) {
          console.error(`Failed to rename file from ${fromPath} to ${toPath}`, error);
        }
        reject(null);
      }

      resolve(toPath);
    });
  }).catch((error) => {
    if (debug) {
      console.error(`Failed to rename file from ${fromPath} to ${toPath}`, error);
    }
  });

module.exports = {
  sortMaps,
};
