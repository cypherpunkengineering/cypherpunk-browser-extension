var authUsername, authPassword;
var userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');
var cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";

/* Try to initialize when background script runs */
if (cypherpunkEnabled) { init(); }
else {
  loadProxies(); // Attempt to load proxy servers even if not enabled
  destroy();
}


/* Event Listener Triggers */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "CypherpunkEnabled") {
    cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
    // Cypherpunk is turned on, enable features based on settings
    if (cypherpunkEnabled) { init(); }
    // Cypherpunk is turned off, disable all features
    else { destroy(); }
  }
  else if (request.action === 'UserAgentSpoofing') {
    userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');
    if (userAgentString) { enableUserAgentSpoofing(); }
    else { disableUserAgentSpoofing(); }
  }
});

/* Proxy Fetching Methods */
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

function loadProxies() {
  // Block auth popup dialog when connected to proxy
  httpGetAsync('https://cypherpunk.privacy.network/api/v0/account/status', (res) => {
    res = JSON.parse(res)
    authUsername = res.privacy.username;
    authPassword = res.privacy.password;
    chrome.runtime.sendMessage({ action: "ProxyAuth", authUsername: authUsername, authPassword: authPassword });
    localStorage.setItem('cypherpunk.premiumAccount', JSON.stringify(res.account.type === 'premium'));

    httpGetAsync('https://cypherpunk.privacy.network/api/v0/location/list/' + res.account.type, (servers) => {
      localStorage.setItem('cypherpunk.proxyServers', servers);
      console.log('SERVERS SAVED', res.account.type);
    });
  });
}


/* PAC Script Methods */
function applyProxy() {
  var config = localStorage.getItem("cypherpunk.pacScriptConfig");
  if (!config) { return };
  var pacScript = JSON.parse(config).pacScript.data;
  console.log('Applying PacScript in BG', pacScript);
  chrome.runtime.sendMessage({ action: "SetPACScript", pacScript: pacScript });
}

function disableProxy() {
  chrome.runtime.sendMessage({ action: "ResetPACScript" });
}


/* Init and Teardown methods */
function init() {

  loadProxies(); // Attempt to fetch Proxy Servers
  applyProxy(); // Attempt to load PAC Script

  // Enable user agent spoofing if user agent string supplied
  var userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');
  if (userAgentString) { enableUserAgentSpoofing(); }
  else { disableUserAgentSpoofing(); }

  // Enable/Disable WebRTC leak protection depending on saved setting
  var webRTCLeakProtectionEnabled = localStorage.getItem('cypherpunk.settings.ffWebRTCLeakProtection') === "true";
  if (webRTCLeakProtectionEnabled) { enableWebRTCLeakProtection(); }
  else { disableWebRTCLeakProtection(); }

  // Set icon to colored Cypherpunk
  chrome.browserAction.setIcon({
   path : {
     "128": "assets/cypherpunk_shaded_128.png",
     "96": "assets/cypherpunk_shaded_96.png",
     "64": "assets/cypherpunk_shaded_64.png",
     "48": "assets/cypherpunk_shaded_48.png",
     "32": "assets/cypherpunk_shaded_32.png",
     "24": "assets/cypherpunk_shaded_24.png",
     "16": "assets/cypherpunk_shaded_16.png"
    }
  });
}

function destroy() {
  disableProxy(); // Disable PAC Script
  disableUserAgentSpoofing(); // Disable user agent spoofing
  disableWebRTCLeakProtection(); // Disable webRTC leak protection

  // Set icon to grey Cypherpunk
  chrome.browserAction.setIcon({
    path : {
      "128": "assets/cypherpunk_grey_128.png",
      "96": "assets/cypherpunk_grey_96.png",
      "64": "assets/cypherpunk_grey_64.png",
      "48": "assets/cypherpunk_grey_48.png",
      "32": "assets/cypherpunk_grey_32.png",
      "24": "assets/cypherpunk_grey_24.png",
      "16": "assets/cypherpunk_grey_16.png"
     }
  });
}


/* Clear cache on url change so ip doesn't leak from previous site */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') {
    chrome.runtime.sendMessage({ action: "ClearCache" });
  }
});


/** WebRTC Leak Prevention **/
function enableWebRTCLeakProtection() {
  chrome.runtime.sendMessage({ action: "EnableWebRTCLeakProtection" });
}

function disableWebRTCLeakProtection() {
  chrome.runtime.sendMessage({ action: "DisableWebRTCLeakProtection" });
}


/** User Agent Spoofing **/
function spoofUserAgent(details) {
  var headers = details.requestHeaders;
  if (!userAgentString) return;
  for (var i = 0, l = headers.length; i < l; ++i) {
    if (headers[i].name === 'User-Agent' || headers[i].name === 'user-agent' ) {
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
