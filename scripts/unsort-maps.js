const path = require('path');
const fs = require('fs');

const { getConfig } = require('./configuration');
const { getRecursiveFileList, moveFile } = require('./util');

/**
 * Given a path, unsorts files, essentially flattening all directories.
 *
 * @param {string} targetDir Target directory to sort files in.
 */
const unsortMaps = async (targetDir) => {
  console.log(`\nUn-sorting maps...`);

  const targetDirFilelist = (await getRecursiveFileList(targetDir)).filter((filePath) =>
    fs.statSync(path.resolve(targetDir, filePath)).isFile()
  );

  targetDirFilelist.map(async (filePath) => {
    try {
      const fileName = filePath.slice(filePath.lastIndexOf('/') + 1);

      await moveFile(path.resolve(targetDir, filePath), path.resolve(targetDir, fileName));
    } catch (error) {
      if (getConfig().debug) {
        console.error('Failed to move file', error);
      }
    }
  });
};

module.exports = {
  unsortMaps,
};
