const axios = require('axios');
const fs = require('fs');
const request = require('request');
const unzipper = require('unzipper');
const chalk = require('chalk');
const path = require('path');
const sanitize = require('sanitize-filename');

const shouldScrape = process.env.FORCE_SCAPE;
const gameType = process.env.GAME_TYPE || 'yr';
const destinationDir = process.env.DESTINATION_DIR || 'cncnet-maps';
const delayBetweenRequests = process.env.REQUEST_DELAY || 500;
const debug = process.env.DEBUG;
const cwd = process.env.RUN_UNPACKAGED ? process.cwd() : path.dirname(process.execPath);
const destinationDirAbsolutePath = path.resolve(cwd, destinationDir);

if (!fs.existsSync(destinationDirAbsolutePath)) {
  fs.mkdirSync(destinationDirAbsolutePath);
  process.stdout.write(`Destination dir does not exist. Creating ${destinationDir} in ${destinationDirAbsolutePath}`);
} else {
  process.stdout.write(`Using existing destination dir: ${destinationDir}`);
}

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
  unzipper.Open.url(request, `http://mapdb.cncnet.org/yr/${hash}.zip`)
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
 * Filters an array of maps by maps already present in the 'file list'.
 *
 * @param { Array<string> } destinationDirFilelist
 */
const filterByExistingMaps = (destinationDirFilelist) => ({ hash }) =>
  !destinationDirFilelist.some((fileName) => {
    const matches = fileName.match(new RegExp(`{{(${hash})}}`, 'gi'));

    if (matches) {
      // If file matches and, presumably, has all the content written, skip it.
      const stats = fs.statSync(`${destinationDirAbsolutePath}/${fileName}`);
      const fileSizeInBytes = stats.size;
      return fileSizeInBytes > 0;
    }
  });

/**
 * Lists all maps then downloads them & unzips into the dir of choice.
 * A delay between requests is made to be nice :-)
 */
const main = async () => {
  const filesWrote = [];
  const filesErrored = [];

  if (shouldScrape) {
    console.warn('Scarping not implemented. Usig cncnet search-json url to list all maps.');
  }

  await axios.get(`https://mapdb.cncnet.org/search-json.php?game=${gameType}&age=12`).then((res) => {
    const destinationDirFilelist = fs.readdirSync(destinationDirAbsolutePath);
    const mapRequests = res.data.filter(filterByExistingMaps(destinationDirFilelist)).map(unzipAsync);
    const filesSkipped = res.data.length - mapRequests.length - 1;

    if (filesSkipped > 0) {
      console.log(`\nSkipped ${destinationDirFilelist.length} existing maps.`);
    }

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
  });

  console.log(`Done.

  -  ${chalk.green(`Downloaded & unzipped: ${chalk.bold(filesWrote.length)}`)}
  -  ${
    filesErrored.length
      ? chalk.red(`Failed to download: ${chalk.bold(filesErrored.length)}`)
      : 'All downloads succesfull.'
  }
  `);
};

main();
