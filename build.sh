#!/bin/bash -x
set -e

# fetch submodules
git submodule update --init --recursive

# fix path
export PATH=$PATH:/usr/local/bin

# build vars
NODE_VERSION=v6.9.3

# load nvm depending on OS
case `uname -s` in
	Darwin)
		source "$(brew --prefix nvm)/nvm.sh" ${NODE_VERSION}
		;;
	FreeBSD|Linux)
		source $HOME/.nvm/nvm.sh ${NODE_VERSION}
		;;
esac

# prepare node/npm
nvm install ${NODE_VERSION}
nvm use ${NODE_VERSION}

# install deps
npm install

# build extension
./node_modules/.bin/ng build --prod --aot

# package as zip
npm run compress

# done
exit 0
