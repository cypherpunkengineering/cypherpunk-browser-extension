#!/bin/bash -e

# archive package artifact
PKG="dist/*.zip"
ARTIFACT="../`printf 'cypherpunk-browser-extension-%05d' ${BUILD_NUMBER}`.pkg"
mv "${PKG}" "${ARTIFACT}"
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/

exit 0
