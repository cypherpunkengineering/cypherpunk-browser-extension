/** Detect proxy auth and send credentials **/

var gPendingCallbacks = [];
var bkg = chrome.extension.getBackgroundPage();
bkg.console.log("Listening")

chrome.webRequest.onAuthRequired.addListener(
  handleAuthRequest,
  {urls: ["<all_urls>"]},
  ['asyncBlocking']
);

function processPendingCallbacks() {
  bkg.console.log("Calling back with credentials");
  var callback = gPendingCallbacks.pop();
  callback({
    authCredentials: {
      username:  localStorage.getItem('cypherpunk.proxy.username'),
      password: localStorage.getItem('cypherpunk.proxy.password')
    }
  });
}

function handleAuthRequest(details, callback) {
  gPendingCallbacks.push(callback);
  processPendingCallbacks();
}


/** User Agent Spoofing **/
var requestFilter = {
  urls: [
    "<all_urls>"
  ]
};

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
  var headers = details.requestHeaders;
  var userAgentType = localStorage.getItem('cypherpunk.advanced.userAgent.type');
  var userAgentString = localStorage.getItem('cypherpunk.advanced.userAgent.string');
  for(var i = 0, l = headers.length; i < l; ++i) {
    if( headers[i].name == 'User-Agent' ) {
      if (userAgentString !== 'false') {
        headers[i].value = userAgentString || headers[i].value;
        bkg.console.log('Setting user agent to', userAgentString);
      }
      break;
    }
  }
  return { requestHeaders: headers };
}, requestFilter, ['requestHeaders','blocking']);


/** Privacy Filter **/
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


/** Force HTTPS */
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

var forceHttps = localStorage.getItem('cypherpunk.advanced.forceHttps') === "true";

if (forceHttps) {
  enableForceHttps();
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if(request.greeting === "ForceHTTPS"){
    if (forceHttps) { enableForceHttps(); }
    else { disableForceHttps(); }
    sendResponse({ forceHttps: forceHttps });
  }
});
