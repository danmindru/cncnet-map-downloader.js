/**
 * Run promise chains with progress.
 *
 * @param { Array<Promise> } promises
 */
const runPromisesWithProgress = (promises, message = '') => {
  let progress = 0;

  const tick = (promise) => {
    promise.then(function () {
      progress++;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${message} ${progress}/${promises.length}`);
    });
    return promise;
  }

  return Promise.all(promises.map(tick));
};

module.exports = {
  runPromisesWithProgress
}
