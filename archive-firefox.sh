#!/bin/bash -e

# archive package artifact
PKG="dist-firefox/cypherpunk-privacy-firefox.xpi"
ARTIFACT="`printf 'cypherpunk-privacy-firefox-%05d' ${BUILD_NUMBER}`.xpi"
cp "${PKG}" "${ARTIFACT}"
echo "Uploading build to builds repo..."
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/
echo "Uploading build to GCS bucket..."
gsutil cp "${ARTIFACT}" gs://builds.cypherpunk.com/builds/firefox/

exit 0
