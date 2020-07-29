[![npm](https://img.shields.io/npm/v/cncnet-map-downloader.js.svg)](https://www.npmjs.com/package/cncnet-map-downloader.js)

# cncnet-map-downloader.js ⬇️💻

Downloads all maps from [cncnet.org](https://cncnet.org) into a directory of your choice.

### Usage

Grab the latest binary release on [the release page](https://github.com/danmindru/cncnet-map-downloader.js/releases) 💽.

Double-click your favorite executable or run the executable through the command line. You will be guided through the options (see demo).

- By default, it only downloads Yuri (yr) maps, but can be configured to download other types. See config below.
- If the process is somehow killed, it will resume downloading maps that haven't been downloaded yet (skips previously downlaoded maps).
- It sorts maps in directories by name (alpha numeric).
- It checks for duplicate maps (size, id, sha).

### Demo

![cncnet-map-downloader linux](https://user-images.githubusercontent.com/1515742/88851006-6ed28980-d1ec-11ea-857e-e6e5b0ec0e2c.gif)

| Windows preview                                                                                                                 | Mac preview                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://user-images.githubusercontent.com/1515742/88851026-75610100-d1ec-11ea-9a7f-5c1eaedc7ee8.gif" width="500px" /> | <img src="https://user-images.githubusercontent.com/1515742/88851022-74c86a80-d1ec-11ea-95dd-7961906351c7.gif" width="500px" /> |

#### Build it yourself

Clone the repo, then run `npm install`. <br/>
You can start a download with `npm run download`. Downloads can be configured in `package.json` under scripts.

### Configuration

You can configure the downloader through enviornment variables.

- `MAP_AGE` - the age of the map in months (default: not specified - will get all). Example: `12` will get maps that are 1 year old and newer.
- `GAME_TYPE` - the type of maps to download (default: `yr`). Available: `ts`, `ra`, `d2`, `td`, `dta`.
- `DESTINATION_DIR` - the location to download files (default: `cncnet-maps`).

#### Configuration examples

- Get all Yuri's Revenge / Red Alert 2 maps in a custom directory

```bash
DESTINATION_DIR=my-yuri-maps ./cncnet-map-downloader-js-x-x-x-macos
```

- Get all Red alert maps

```bash
GAME_TYPE=ra ./cncnet-map-downloader-js-x-x-x-macos
```

- Get all Tiberian Sun maps, not older than 1 year

```bash
GAME_TYPE=ts MAP_AGE=12 ./cncnet-map-downloader-js-x-x-x-macos
```

##### Dev config

- `RUN_UNPACKAGED` - run the script in unpacked mode[1] (default: `false`; see `npm run download` in `package.json` for an example).
- `DEBUG` - print additional debug info.

> [1] essentially, run the non-binary script. Requires node v12.9+ & `npm install`

### About the method

Uses the cncnet search endpoint to retrieve all existing maps, then requests each map zip individually with a delay to be nice on the server.

Previously, scarping was considered, but not necessary at this point in time.

### Debugging

Run

```
DEBUG=true MAX_NUMBER_OF_MAPS=5 REQUEST_DELAY=5000 MAP_AGE=1 RUN_UNPACKAGED=true GAME_TYPE=yr DESTINATION_DIR=./cncnet-yuri-maps node --inspect-brk ./scripts/main.js
```

And open `chrome://inspect` to debug the node process.

### Other art

Check out the [cncnet search](https://mapdb.cncnet.org/search/?game=yr&search=), where you can search and download maps.
