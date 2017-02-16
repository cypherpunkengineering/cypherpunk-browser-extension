#!/bin/bash -e

# archive package artifact
PKG="dist/cypherpunk-privacy-firefox.zip"
ARTIFACT="`printf 'cypherpunk-privacy-firefox-%05d' ${BUILD_NUMBER}`.zip"
cp "${PKG}" "${ARTIFACT}"
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/

exit 0
