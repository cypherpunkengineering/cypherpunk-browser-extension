#!/bin/bash -e

# archive package artifact
PKG="dist/cypherpunk-privacy-chrome.zip"
ARTIFACT="`printf 'cypherpunk-privacy-chrome-%05d' ${BUILD_NUMBER}`.zip"
cp "${PKG}" "${ARTIFACT}"
echo "Uploading build to builds repo..."
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/
echo "Uploading build to GCS bucket..."
gsutil cp "${ARTIFACT}" gs://builds.cypherpunk.com/builds/chrome/
echo "Sending notification to slack..."
curl -X POST --data "payload={\"text\": \"cypherpunk-privacy-chrome build ${BUILD_NUMBER} is now available from https://download.cypherpunk.com/builds/chrome/${ARTIFACT}\"}" https://hooks.slack.com/services/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

exit 0
