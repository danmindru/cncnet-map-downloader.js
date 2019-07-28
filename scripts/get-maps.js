const axios = require('axios');
const fs = require('fs');
const request = require('request');
const unzipper = require('unzipper');
const chalk = require('chalk');

const shouldScrape = process.env.FORCE_SCAPE;
const gameType = process.env.GAME_TYPE;
const destinationDir = process.env.DESTINATION_DIR;
const delayBetweenRequests = process.env.REQUEST_DELAY || 500;
const debug = process.env.DEBUG;

if (!fs.existsSync(destinationDir)) {
  fs.mkdirSync(destinationDir);
  console.log(`Created destination dir: ${destinationDir}`);
} else {
  console.log(`Using existing destination dir: ${destinationDir}`);
}

/**
 * Wraps a fs.writeFile call into a promise.
 *
 * @param { strin } name
 * @param { Buffer } buffer
 */
const writeFileAsync = (name, buffer) =>
  new Promise((resolve, reject) => {
    fs.writeFile(`${destinationDir}/${name}`, buffer, function(err) {
      if (err) {
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
          const prettyFileName = name + file.path.slice(file.path.lastIndexOf('.') - 1);
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
    const mapRequests = res.data.map(unzipAsync);

    const handleUnzipPromise = (unzipPromise) => () =>
      unzipPromise()
        .then((hashes) => filesWrote.push(...hashes))
        .catch((hash) => filesErrored.push(hash));

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
