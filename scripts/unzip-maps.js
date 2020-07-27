const sanitize = require('sanitize-filename');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const request = require('request');
const chalk = require('chalk');

const { debug, cwd, destinationDirAbsolutePath, gameType, delayBetweenRequests } = require('./constants');
const { replaceLine, replaceOraLine } = require('./util');

/**
 * Delays by the specified time.
 *
 * @param { number } time
 */
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

/**
 * Builds a file name, escaping strange chars & appending the hash.
 *
 * @param { string } name
 * @param { string } hash
 * @param { string } filePath
 */
const buildFileName = (name, hash, filePath) =>
  sanitize(name + ` {{${hash}}}` + filePath.slice(filePath.lastIndexOf('.') || '.map'));

/**
 * Wraps a fs.writeFile call into a promise.
 *
 * @param { string } fileName
 * @param { Buffer } buffer
 * @param { string } hash
 */
const writeFileAsync = (fileName, buffer, hash) =>
  new Promise((resolve, reject) => {
    const filePath = path.resolve(cwd, fileName);
    if (debug) {
      console.log(`\nWriting ${fileName} to ${filePath}`);
    }

    fs.writeFile(filePath, buffer, function (err) {
      if (err) {
        console.error(chalk.red(`\nFailed to write file ${fileName} to ${filePath}`), err);
        reject(hash);
      }

      resolve(hash);
    });
  });

/**
 * Unzips a file from a url.
 *
 * @param { {name: string, hash: string, date: string } } mapObject Cncnet map object.
 *
 * @return { string } hash of unzipped file (or file that errored during unzip).
 */
const unzipAsync = ({ name, hash } = {}) =>
  unzipper.Open.url(request, `http://mapdb.cncnet.org/${gameType}/${hash}.zip`)
    .then(async (directory) =>
      Promise.all(
        directory.files.map(async (file) => {
          const buffer = await file.buffer();
          const prettyFileName = `${destinationDirAbsolutePath}/${buildFileName(name, hash, file.path)}`;
          return writeFileAsync(prettyFileName, buffer, hash);
        })
      )
    )
    .catch((error) => {
      console.error(chalk.red(`\nFailed to download & unzip file ${name} (hash: ${hash})`, error));
      throw hash;
    });

/**
 * Downloads & Unzips a list of map objects.
 *
 * @param { Array<{name: string, hash: string, date: string }> } mapObjects
 * @param { number } numberOfFilesSkipped
 * @param { Object } [spinner] Ora spinner instance used to display progress.
 *
 * @return { { filesErrored: Array<string>, filesWrote: Array<string> } }
 */

const downloadAndUnzipMaps = async (mapObjects, numberOfFilesSkipped, spinner) => {
  const filesErrored = [];
  const filesWrote = [];

  // Run promises in sequence with a delay, to not upset our cncnet friends.
  for (const mapObject of mapObjects) {
    await delay(delayBetweenRequests);

    try {
      // Try to unzip a file, writing the status in the terminal. Either pushes the has to the filesWrote or filesErrored object.
      const message = `Downloading & unzipping ${filesWrote.length + filesErrored.length + 1}/${
        mapObjects.length
      } (${numberOfFilesSkipped} skipped)`;

      if (spinner) {
        replaceOraLine(message, spinner);
      } else {
        replaceLine(message);
      }

      const hashes = await unzipAsync(mapObject);
      filesWrote.push(...hashes);
    } catch (error) {
      if (debug) {
        console.error(error);
      }
      filesErrored.push(error);
    }
  }

  return {
    filesErrored,
    filesWrote,
    numberOfFilesSkipped,
  };
};

module.exports = {
  downloadAndUnzipMaps,
};
