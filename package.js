const { exec } = require('pkg');
const { name, version } = require('./package.json');
const fs = require('fs');
const packageDir = './packages';
const entry = './scripts/get-maps.js';
const targets = ['node10-linux-x64', 'node10-macos-x64', 'node10-win-x64'];

if (!fs.existsSync(packageDir)) {
  fs.mkdirSync(packageDir);
}

const packageCode = async () => {
  await exec([entry, '--target', targets[0], '--output', `${packageDir}/${name}-${version}-linux`]);
  console.log(`Packaged for linux`);

  await exec([entry, '--target', targets[1], '--output', `${packageDir}/${name}-${version}-macos`]);
  console.log(`Packaged for mac`);

  await exec([entry, '--target', targets[2], '--output', `${packageDir}/${name}-${version}-windows.exe`]);
  console.log(`Packaged for windows`);
};

packageCode();
