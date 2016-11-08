#!/bin/bash -e

# fetch submodules
git submodule update --init --recursive

# fix path
export PATH=$PATH:/usr/local/bin

# prepare nvm
export NVM_DIR="$HOME/.nvm"
source "$(brew --prefix nvm)/nvm.sh" v6.8.0
nvm install v6.8.0
nvm alias default v6.8.0
nvm use v6.8.0

# install deps
npm install

# build extension
ng build --prod

# package as zip
npm run compress

# done
exit 0
