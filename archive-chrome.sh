#!/bin/bash -e

# archive package artifact
PKG="dist/cypherpunk-privacy-chrome.zip"
ARTIFACT="`printf 'cypherpunk-privacy-chrome-%05d' ${BUILD_NUMBER}`.zip"
cp "${PKG}" "${ARTIFACT}"
echo "Uploading build to builds repo..."
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/
echo "Uploading build to GCS bucket..."
gsutil cp "${ARTIFACT}" gs://builds.cypherpunk.com/builds/chrome/

exit 0
