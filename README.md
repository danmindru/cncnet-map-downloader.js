# cncnet-map-downloader.js
Downloads all maps from [cncnet.org](https://cncnet.org) into a directory of your choice.

By default, it only downloads Yuri (yr) maps, but can be configured to download other types.

Download the latest binary release for your OS on [the release page](https://github.com/DHI/html-import-updater/releases).



### Configuration

### About the method
Uses the cncnet search endpoint to retrieve all existing maps, then requests each map zip individually with a delay to be nice on the server.

Previously, scarping was considered, but not necessary at this point in time.
