const { resolve } = require('path');
const { readdir } = require('fs').promises;
const { debug } = require('./constants');

/**
 * Run promise chains with progress.
 *
 * @param { Array<Promise> } promises
 */
const runPromisesWithProgress = (promises, message = '') => {
  let progress = 0;

  const tick = (promise) =>
    promise.then((res) => {
      progress++;
      replaceLine(`${message} ${progress}/${promises.length}`);
      return res;
    });

  return Promise.all(promises.map(tick)).catch((error) => {
    if (debug) {
      console.error('Failed to run promises with progress', error);
    }
  });
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

module.exports = {
  runPromisesWithProgress,
  replaceLine,
  replaceOraLine,
  getRecursiveFileList,
};
