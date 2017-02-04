#!/bin/bash

mv angular-cli.json chrome.angular-cli.json
mv firefox.angular-cli.json angular-cli.json

ng build

mv angular-cli.json firefox.angular-cli.json
mv chrome.angular-cli.json angular-cli.json

cp -R firefox-entrypoint/* dist-firefox
