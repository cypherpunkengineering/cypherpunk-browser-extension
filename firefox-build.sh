#!/bin/bash

# copy over firefox.angular-cli.json to angular-cli.json
mv angular-cli.json chrome.angular-cli.json
mv firefox.angular-cli.json angular-cli.json

# rename firefox.manifest.json to manifest.json
mv src/manifest.json src/chrome.manifest.json
mv src/firefox.manifest.json src/manifest.json

# build extension
if [[ $* == *--prod* ]]
then
  echo "Building for production"
  ng build --aot
else
  echo "Building for development"
  ng build
fi

# move original angular-cli.json back
mv angular-cli.json firefox.angular-cli.json
mv chrome.angular-cli.json angular-cli.json

# move original manifest.json back
mv src/manifest.json src/firefox.manifest.json
mv src/chrome.manifest.json src/manifest.json

# copy to dist folder
cp -R firefox-entrypoint/* dist-firefox

# package as xpi
if [[ $* == *--prod* ]]
then
  npm run compress-ff
fi

# done
exit 0
