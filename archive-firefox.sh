#!/bin/bash -e

# archive package artifact
PKG="dist-firefox/cypherpunk-privacy-firefox.xpi"
ARTIFACT="`printf 'cypherpunk-privacy-firefox-%05d' ${BUILD_NUMBER}`.xpi"
cp "${PKG}" "${ARTIFACT}"
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/

exit 0
