const sanitize = require('sanitize-filename');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const request = require('request');

const { debug, cwd, destinationDirAbsolutePath, gameType, delayBetweenRequests } = require('./constants');

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
 * @param { string } name
 * @param { Buffer } buffer
 */
const writeFileAsync = (fileName, buffer) =>
  new Promise((resolve, reject) => {
    const filePath = path.resolve(cwd, fileName);
    if (debug) {
      console.log(`Writing ${fileName} to ${filePath}`);
    }

    fs.writeFile(filePath, buffer, function(err) {
      if (err) {
        if (debug) {
          console.error(`Failed to write file ${fileName} to ${filePath}`, err);
        }

        reject(err);
      }

      resolve();
    });
  });

/**
 * Unzips a file from a url.
 *
 * @param { {name: string, hash: string, date: string } } mapObject Cncnet map object.
 */
const unzipAsync = ({ name, hash } = {}) => () =>
  unzipper.Open.url(request, `http://mapdb.cncnet.org/${gameType}/${hash}.zip`)
    .then(
      async (directory) =>
        await directory.files.map(async (file) => {
          const buffer = await file.buffer();
          const prettyFileName = `${destinationDirAbsolutePath}/${buildFileName(name, hash, file.path)}`;
          await writeFileAsync(prettyFileName, buffer);
          return hash;
        })
    )
    .catch((error) => {
      if (debug) {
        console.error(error);
      }
      throw hash;
    });

/**
 *
 * @param { Array<mapObject> } maps
 */
const unzipMaps = (mapObjects) => {
  const filesErrored = [];
  const filesWrote = [];
  const mapRequests = mapObjects.map(unzipAsync);

  const handleUnzipPromise = (unzipPromise) => () => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Downloading ${filesWrote.length + filesErrored.length + 1}/${mapRequests.length}`);
    unzipPromise()
      .then((hashes) => filesWrote.push(...hashes))
      .catch((hash) => filesErrored.push(hash));
  };

  // Run promises in sequence with a delay.
  return mapRequests.reduce(
    (acc, cur) =>
      acc.then(() =>
        new Promise((resolve) => setTimeout(() => resolve(), delayBetweenRequests)).then(handleUnzipPromise(cur))
      ),
    Promise.resolve()
  );
};

module.exports = {
  unzipMaps
};
