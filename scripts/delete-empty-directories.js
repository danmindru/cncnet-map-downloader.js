const fs = require('fs');
const path = require('path');

const { getRecursiveFileList, removeDirectory } = require('./util');
const { getConfig } = require('./configuration');

/**
 * Given a path, removes all empty directoies in that path
 *
 * @param {string} targetDir Target directory to remove empty directories in.
 */
const deleteEmptyDirectories = async (targetDir) => {
  const targetDirFilelist = fs.readdirSync(targetDir).filter((filePath) => {
    try {
      return fs.statSync(path.resolve(targetDir, filePath)).isDirectory();
    } catch (error) {
      if (getConfig().debug) {
        console.error('Failed to stat file', error);
      }
      return false;
    }
  });

  const dirFilelists = await Promise.all(
    targetDirFilelist.map(async (dirPath) => {
      const absolutePath = path.resolve(targetDir, dirPath);
      const filelist = await getRecursiveFileList(absolutePath);

      return {
        filelist,
        dirPath,
      };
    })
  );
  const emptyDirs = dirFilelists
    .filter(({ filelist }) => {
      return filelist.length === 0;
    })
    .map(({ dirPath }) => dirPath);

  const dirRemovalPromises = emptyDirs.map(removeDirectory(targetDir));
  return Promise.all(dirRemovalPromises);
};

module.exports = {
  deleteEmptyDirectories,
};
