// TODO: Change back to true once we have api providing url list
function cancelRequest(details) { return { cancel: false }; };

function disablePrivacyFilter() {
  chrome.webRequest.onBeforeRequest.removeListener(cancelRequest);
}

function enablePrivacyFilter() {
  disablePrivacyFilter();
  chrome.webRequest.onBeforeRequest.addListener(
    cancelRequest,
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
};

chrome.tabs.onActivated.addListener(function (tab) {
  chrome.tabs.get(tab.tabId, function(tab) {
    var url = tab.url;
    if (!url) { return; }

    var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    var privacyFilterWhitelist = localStorage.getItem('cypherpunk.privacyFilterWhitelist');
    privacyFilterWhitelist = JSON.parse(privacyFilterWhitelist);

    // Privacy Filter is enabled unless domain is in white list
    var privacyFilterEnabled = !(privacyFilterWhitelist && privacyFilterWhitelist[domain] === false);

    // Start privacy filter if enabled
    if (privacyFilterEnabled) { enablePrivacyFilter(); }
    else { disablePrivacyFilter(); }

  });
});


function redirectRequest(requestDetails) {
  return { redirectUrl: requestDetails.url.replace(/^http:\/\//i, 'https://') };
}

function disableForceHttps() {
  chrome.webRequest.onBeforeRequest.removeListener(redirectRequest);
}

function enableForceHttps() {
  chrome.webRequest.onBeforeRequest.addListener(
    redirectRequest,
    { urls:['http://*/*'] },
    ['blocking']
  );
}
