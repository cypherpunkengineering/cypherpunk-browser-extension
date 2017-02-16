#!/bin/bash -e

# archive package artifact
PKG="dist-firefox/cypherpunk-privacy-firefox.xpi"
ARTIFACT="`printf 'cypherpunk-privacy-firefox-%05d' ${BUILD_NUMBER}`.xpi"
cp "${PKG}" "${ARTIFACT}"
echo "Uploading build to builds repo..."
scp -P92 "${ARTIFACT}" upload@builds-upload.cypherpunk.engineering:/data/builds/
echo "Uploading build to GCS bucket..."
gsutil cp "${ARTIFACT}" gs://builds.cypherpunk.com/builds/firefox/
echo "Sending notification to slack..."
curl -X POST --data "payload={\"text\": \"cypherpunk-privacy-firefox build ${BUILD_NUMBER} is now available from https://download.cypherpunk.com/builds/firefox/${ARTIFACT}\"}" https://hooks.slack.com/services/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

exit 0
