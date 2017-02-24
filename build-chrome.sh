#!/bin/bash -x
set -e
echo "Building for Chrome production"

# fetch submodules
git submodule update --init --recursive

# fix path
export PATH=$PATH:/usr/local/bin

# build vars
NODE_VERSION=v6.9.3

# load nvm depending on OS
export NVM_DIR=$HOME/.nvm
case `uname -s` in
	Darwin)
		source "$(brew --prefix nvm)/nvm.sh"
		;;
	FreeBSD|Linux)
		source $HOME/.nvm/nvm.sh
		;;
esac

# prepare node/npm
nvm install ${NODE_VERSION}
nvm use ${NODE_VERSION}

# install deps
npm install

# copy over chrome.angular-cli.json to angular-cli.json
cp chrome.angular-cli.json angular-cli.json

# rename chrome.manifest.json to manifest.json
cp src/chrome.manifest.json src/manifest.json

# build extension
./node_modules/.bin/ng build --prod --aot

# copy ad and malware lists over
cp src/ad-list.js dist/
cp src/malware-list.js dist/

# package as zip
npm run compress

# done
exit 0
