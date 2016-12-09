var cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
var forceHttps = localStorage.getItem('cypherpunk.advanced.forceHttps') === "true";
var privacyFilterEnabled = localStorage.getItem('advanced.privacyFilter.enabled') === "true";
var userAgentString = localStorage.getItem('cypherpunk.advanced.userAgent.string');

var authUsername, authPassword;

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

function init() {
  // Block auth popup dialog when connected to proxy
  httpGetAsync('https://cypherpunk.com/api/v0/account/status', function(res) {
    res = JSON.parse(res)
    authUsername = res.privacy.username;
    authPassword = res.privacy.password;

    enableProxyAuthCredentials();
  });

  // Enable force http if it's enabled
  if (forceHttps) { enableForceHttps(); }
  else { disableForceHttps(); }

  // Enable user agent spoofing if user agent string supplied
  if (userAgentString) { enableUserAgentSpoofing(); }
  else { disableUserAgentSpoofing(); }
}

function destroy() {
  disableProxyAuthCredentials();
  disableUserAgentSpoofing();
  disableForceHttps();
  disablePrivacyFilter();
}

if (cypherpunkEnabled) { init(); }
else { destroy(); }

// Event Listener Triggers
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (request.greeting === "CypherpunkEnabled"){
    cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
    // Cypherpunk is turned on, enable features based on settings
    if (cypherpunkEnabled) { init(); }
    // Cypherpunk is turned off, disable all features
    else { destroy(); }
  }
  else if (request.greeting === "ForceHTTPS"){
    forceHttps = localStorage.getItem('cypherpunk.advanced.forceHttps') === "true"
    if (forceHttps) { enableForceHttps(); }
    else { disableForceHttps(); }
    sendResponse({ forceHttps: forceHttps });
  }
  else if (request.greeting === 'UserAgentSpoofing') {
    userAgentString = localStorage.getItem('cypherpunk.advanced.userAgent.string');
    if (userAgentString) { enableUserAgentSpoofing(); }
    else { disableUserAgentSpoofing(); }
  }
  else if (request.greeting === 'PrivacyFilter') {
    // Reload current tab to update blocked requests
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  }
});


/** Block Proxy Auth Dialog **/
function supplyProxyCredentials(details, callbackFn) {
  callbackFn({ authCredentials: {username: authUsername, password: authPassword} });
}

function disableProxyAuthCredentials() {
  console.log('Disabling Proxy Auth');
  chrome.webRequest.onAuthRequired.removeListener(supplyProxyCredentials);
}

function enableProxyAuthCredentials() {
  disableProxyAuthCredentials();
  console.log('Enabling Proxy Auth');
  chrome.webRequest.onAuthRequired.addListener(
    supplyProxyCredentials,
    {urls: ["<all_urls>"]},
    ['asyncBlocking']
  );
}


/** User Agent Spoofing **/
function spoofUserAgent(details) {
  var headers = details.requestHeaders;
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
}

function disableUserAgentSpoofing() {
  console.log('Disabling User Agent Spoofing');
  chrome.webRequest.onBeforeSendHeaders.removeListener(spoofUserAgent);
}

function enableUserAgentSpoofing() {
  disableUserAgentSpoofing();
  console.log('Enabling User Agent Spoofing');
  chrome.webRequest.onBeforeSendHeaders.addListener(
    spoofUserAgent,
    { urls: ["<all_urls>"] },
    ['requestHeaders','blocking']
  );
}


/** Privacy Filter **/
// TODO: Change back to true once we have api providing url list
function cancelRequest(details) { return { cancel: false }; };

function disablePrivacyFilter() {
  console.log('Disabling Privacy Filter');
  chrome.webRequest.onBeforeRequest.removeListener(cancelRequest);
}

function enablePrivacyFilter() {
  disablePrivacyFilter();
  console.log('Enabling Privacy Filter');
  chrome.webRequest.onBeforeRequest.addListener(
    cancelRequest,
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
};

// Enable privacy filter if it's enabled
chrome.tabs.onActivated.addListener(function (tab) {
  chrome.tabs.get(tab.tabId, function(tab) {
    var url = tab.url;
    if (!url) { return; }

    var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    var privacyFilterWhitelist = localStorage.getItem('cypherpunk.privacyFilterWhitelist');
    privacyFilterWhitelist = JSON.parse(privacyFilterWhitelist);

    // Privacy Filter is enabled unless domain is in white list
    var enabled = !(privacyFilterWhitelist && privacyFilterWhitelist[domain] === false);

    // Start privacy filter if enabled and cypherpunk is on
    if (cypherpunkEnabled && privacyFilterEnabled && enabled) { enablePrivacyFilter(); }
    else { disablePrivacyFilter(); }

  });
});


/** Force HTTPS */
function redirectRequest(requestDetails) {
  return { redirectUrl: requestDetails.url.replace(/^http:\/\//i, 'https://') };
}

function disableForceHttps() {
  console.log('Disabling Force HTTPS');
  chrome.webRequest.onBeforeRequest.removeListener(redirectRequest);
}

function enableForceHttps() {
  disableForceHttps();
  console.log('Enabling Force HTTPS');
  chrome.webRequest.onBeforeRequest.addListener(
    redirectRequest,
    { urls:['http://*/*'] },
    ['blocking']
  );
}

