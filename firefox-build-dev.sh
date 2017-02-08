#!/bin/bash
echo "Building for development"

# copy over firefox.angular-cli.json to angular-cli.json
mv angular-cli.json chrome.angular-cli.json
mv firefox.angular-cli.json angular-cli.json

# rename firefox.manifest.json to manifest.json
mv src/manifest.json src/chrome.manifest.json
mv src/firefox.manifest.json src/manifest.json

# build extension
ng build

# move original angular-cli.json back
mv angular-cli.json firefox.angular-cli.json
mv chrome.angular-cli.json angular-cli.json

# move original manifest.json back
mv src/manifest.json src/firefox.manifest.json
mv src/chrome.manifest.json src/manifest.json

# copy to dist folder
cp -R firefox-entrypoint/* dist-firefox

# done
exit 0
