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

module.exports = {
  runPromisesWithProgress,
  replaceLine,
  replaceOraLine,
};
