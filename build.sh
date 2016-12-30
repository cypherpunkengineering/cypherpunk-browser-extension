#!/bin/bash -e

# fetch submodules
git submodule update --init --recursive

# fix path
export PATH=$PATH:/usr/local/bin

# build vars
NODE_VERSION=v7.2.1

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
npm install -g angular-cli@1.0.0-beta.22-1
npm install

# build extension
ng build --prod --aot

# package as zip
npm run compress

# done
exit 0
