#!/bin/bash -e

# fetch submodules
git submodule update --init --recursive

# fix path
export PATH=$PATH:/usr/local/bin

# prepare nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
nvm install v7.0.0
nvm alias default v7.0.0
nvm use v7.0.0

# install deps
npm install -g angular-cli
npm install

# build extension
ng build --prod --aot

# package as zip
npm run compress

# done
exit 0
