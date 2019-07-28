# cncnet-map-downloader.js
Downloads all maps from [cncnet.org](https://cncnet.org) into a directory of your choice.

### Usage
Grab the latest binary release on [the release page](https://github.com/DHI/html-import-updater/releases) 💽.

Double-click your favorite executable (win, mac, linux).

- By default, it only downloads Yuri (yr) maps, but can be configured to download other types.
- If the process is somehow killed, it will resume downloading maps that haven't been downloaded yet.

#### Build it yourself
Clone the repo, then run `npm install`. <br/>
You can start a download with `npm run download`. Downloads can be configured in `package.json` under scripts.

### Configuration
- `RUN_UNPACKAGED` - run the script in unpacked mode[1] (default: `false`; see `npm run download` for an example)
- `GAME_TYPE` - the type of maps to download (default: `yr`)
- `DESTINATION_DIR` - the location to download files (default: `cncnet-maps`)

> [1] essentially, run the non-binary script. Requires node v10+ & `npm install`

### About the method
Uses the cncnet search endpoint to retrieve all existing maps, then requests each map zip individually with a delay to be nice on the server.

Previously, scarping was considered, but not necessary at this point in time.

### Other art
Check out the [cncnet search](https://mapdb.cncnet.org/search/?game=yr&search=), where you can search and download maps.
