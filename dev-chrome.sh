# copy over chrome.angular-cli.json to angular-cli.json
cp chrome.angular-cli.json angular-cli.json

# rename chrome.manifest.json to manifest.json
cp src/chrome.manifest.json src/manifest.json

# build extension
ng build --prod --aot

# copy ad and malware lists over
cp src/ad-list.js dist/
cp src/malware-list.js dist/
