# copy over firefox.angular-cli.json to angular-cli.json
cp firefox.angular-cli.json angular-cli.json

# rename firefox.manifest.json to manifest.json
cp src/firefox.manifest.json src/manifest.json

# build extension
ng build --prod --aot

# copy to dist folder
cp -R firefox-entrypoint/* dist-firefox

# copy ad and malware list to dist-firefox/webextension
cp src/ad-list.js dist-firefox/webextension/		
cp src/malware-list.js dist-firefox/webextension/


# package as xpi
npm run compress-ff
