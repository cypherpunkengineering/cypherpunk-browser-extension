#!/bin/bash -e

# archive package artifact
PKG="dist/cypherpunk-browser-extension.zip"
ARTIFACT="`printf 'cypherpunk-browser-extension-%05d' ${BUILD_NUMBER}`.zip"
cp "${PKG}" "${ARTIFACT}"
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/

exit 0
