const path = require('path');
const fs = require('fs');

const { resolve } = require('path');
const { readdir } = require('fs').promises;
const { getConfig } = require('./configuration');

/**
 * Run promise chains with progress.
 *
 * @param { Array<Promise> } promises
 */
const runPromisesWithProgress = (promises, message = '') => {
  let progress = 0;

  const tick = (promise) =>
    promise
      .then((res) => {
        progress++;
        replaceLine(`${message} ${progress}/${promises.length}`);
        return res;
      })
      .catch((error) => {
        if (getConfig().debug) {
          console.error('Failed to run promise with progress', error);
        }
      });

  return Promise.all(promises.map(tick));
};

/**
 * Writes 'on top' of the current terminal line.
 *
 * @param { string } message
 */
const replaceLine = (message) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(message);
};

/**
 * Replaces an ora spinner line with the provided message.
 *
 * @param { string } message
 * @param { Object } spinner
 */
const replaceOraLine = (message, spinner) => {
  spinner.text = message;
};

/**
 * Gets a 'deep' filelist of the given dir.
 *
 * @param { string } targetDir
 */
const getRecursiveFileList = async (targetDir) => {
  const items = await readdir(targetDir, { withFileTypes: true });
  const files = await Promise.all(
    items.map((item) => {
      const res = resolve(targetDir, item.name);
      return item.isDirectory() ? getRecursiveFileList(res) : res;
    })
  );
  return Array.prototype.concat(...files);
};

/**
 * Checks if a file exists.
 *
 * @param {string} filePath
 */
const doesFileExist = async (filePath) =>
  fs.promises
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

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
        if (getConfig().debug) {
          console.error(`Failed to rename file from ${fromPath} to ${toPath}`, error);
        }
        return reject(null);
      }

      return resolve(toPath);
    });
  }).catch((error) => {
    if (getConfig().debug) {
      console.error(`Failed to rename file from ${fromPath} to ${toPath}`, error);
    }
  });

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
  ).catch((error) => {
    if (getConfig().debug) {
      console.error(`Failed to remove ${filePath}`, error);
    }
  });

/**
 * Remove a directory.
 *
 * @param { string } targetDir
 */
const removeDirectory = (targetDir) => (dirPath) =>
  new Promise((resolve, reject) =>
    fs.rmdir(path.resolve(targetDir, dirPath), (error) => {
      if (error) {
        console.error(`Failed to remove ${dirPath}`, error);
        reject(null);
      }

      resolve(path.resolve(targetDir, dirPath));
    })
  ).catch((error) => {
    if (getConfig().debug) {
      console.error(`Failed to remove ${dirPath}`, error);
    }
  });

module.exports = {
  runPromisesWithProgress,
  replaceLine,
  replaceOraLine,
  getRecursiveFileList,
  moveFile,
  removeFile,
  removeDirectory,
  doesFileExist,
};
