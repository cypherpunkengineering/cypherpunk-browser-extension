#!/bin/bash -x
set -e
echo "Building for Firefox production"

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

# copy over firefox.angular-cli.json to angular-cli.json
cp firefox.angular-cli.json angular-cli.json

# rename firefox.manifest.json to manifest.json
cp src/firefox.manifest.json src/manifest.json

# build extension
./node_modules/.bin/ng build --prod --aot

# copy to dist folder
cp -R firefox-entrypoint/* dist-firefox

# package as xpi
npm run compress-ff

# done
exit 0
