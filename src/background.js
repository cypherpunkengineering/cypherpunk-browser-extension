function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      callback(xmlHttp.responseText);
    }
  }
  xmlHttp.open("GET", theUrl, true); // true for asynchronous
  xmlHttp.send(null);
}

httpGetAsync('https://cypherpunk.com/api/v0/account/status', function(res) {
  res = JSON.parse(res)
  var authUsername = res.privacy.username;
  var authPassword = res.privacy.password;

  /** Detect proxy auth and send credentials **/
  var gPendingCallbacks = [];
  var bkg = chrome.extension.getBackgroundPage();

  chrome.webRequest.onAuthRequired.addListener(
    function(details, callbackFn) {
      callbackFn({ authCredentials: {username: authUsername, password: authPassword} });
    },
    {urls: ["<all_urls>"]},
    ['asyncBlocking']
  );
});


/** User Agent Spoofing **/
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
  var headers = details.requestHeaders;
  var userAgentString = localStorage.getItem('cypherpunk.advanced.userAgent.string');
  if (!userAgentString) return;
  for(var i = 0, l = headers.length; i < l; ++i) {
    if( headers[i].name == 'User-Agent' ) {
      if (userAgentString !== 'false') {
        headers[i].value = userAgentString || headers[i].value;
      }
      break;
    }
  }
  return { requestHeaders: headers };
}, { urls: ["<all_urls>"] }, ['requestHeaders','blocking']);


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
