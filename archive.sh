#!/bin/bash -e

# archive package artifact
PKG="dist/cypherpunk-privacy-chrome.zip"
ARTIFACT="`printf 'cypherpunk-privacy-chrome-%05d' ${BUILD_NUMBER}`.zip"
cp "${PKG}" "${ARTIFACT}"
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/

exit 0
