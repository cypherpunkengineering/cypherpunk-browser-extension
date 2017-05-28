// background script variables
var authUsername;
var authPassword;
var chrome = chrome ? chrome : null;
var regionOrder = ['DEV', 'NA', 'SA', 'CR', 'EU', 'ME', 'AF', 'AS', 'OP'];
var adList = window.adList;
var malwareList = window.malwareList;

var ENABLED = 'cypherpunk.enabled';
var LATENCY_LIST = 'cypherpunk.latencyList';
var ACCOUNT_TYPE = 'cypherpunk.account.type';
var PROXY_SERVERS = 'cypherpunk.proxyServers';
var PREMIUM_ACCOUNT = 'cypherpunk.premiumAccount';
var PROXY_SERVERS_ARR = 'cypherpunk.proxyServersArr';
var PAC_SCRIPT_CONFIG = 'cypherpunk.pacScriptConfig';
var USER_AGENT_STRING = 'cypherpunk.settings.userAgent.string';
var WEB_RTC_LEAK_PROTECTION = 'cypherpunk.settings.ffWebRTCLeakProtection';
var PRIVACY_FILTER_ADS = 'cypherpunk.settings.privacyFilter.blockAds';
var PRIVACY_FILTER_MALWARE = 'cypherpunk.settings.privacyFilter.blockMalware';
var MICROPHONE_PROTECTION = 'cypherpunk.microphoneProtection';
var CAMERA_PROTECTION = 'cypherpunk.cameraProtection';

// variables from localStorage
var userAgentString = localStorage.getItem(USER_AGENT_STRING);
var cypherpunkEnabled = localStorage.getItem(ENABLED) === "true";
var serverArr = JSON.parse(localStorage.getItem(PROXY_SERVERS_ARR));
var globalBlockAds = JSON.parse(localStorage.getItem(PRIVACY_FILTER_ADS));
var globalBlockMalware = JSON.parse(localStorage.getItem(PRIVACY_FILTER_MALWARE));
var microphoneProtection = JSON.parse(localStorage.getItem(MICROPHONE_PROTECTION));
var cameraProtection = JSON.parse(localStorage.getItem(CAMERA_PROTECTION));


/** Start up code **/

// Enable Ad/Malware blocking
if (globalBlockAds || globalBlockMalware) { enablePrivacyFilter(); }
else { disablePrivacyFilter(); }

// Enable user agent spoofing if user agent string supplied
userAgentString = localStorage.getItem(USER_AGENT_STRING);
if (userAgentString) { enableUserAgentSpoofing(); }
else { disableUserAgentSpoofing(); }

// Enable/Disable WebRTC leak protection depending on saved setting
var webRTCLeakProtectionEnabled = localStorage.getItem(WEB_RTC_LEAK_PROTECTION) === 'true';
if (webRTCLeakProtectionEnabled) { enableWebRTCLeakProtection(); }
else { disableWebRTCLeakProtection(); }

// Enable/Disable Microphone Protection depending on saved setting
microphoneProtection = JSON.parse(localStorage.getItem(MICROPHONE_PROTECTION));
if (microphoneProtection) { enableMicrophoneProtection(); }
else { disableMicrophoneProtection(); }

// Enable/Disable Camera Protection depending on saved setting
cameraProtection = JSON.parse(localStorage.getItem(CAMERA_PROTECTION));
if (cameraProtection) { enableCameraProtection(); }
else { disableCameraProtection(); }


// save all the open tabs
if (cypherpunkEnabled) { init(); }
else {
  // Attempt to load proxy servers even if not enabled
  loadProxies();
  destroy();
}

function init() {
  loadProxies(); // Attempt to fetch Proxy Servers
  applyProxy(); // Attempt to load PAC Script

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
  disablePrivacyFilter(); // Disable proxy filter onWebRequest
  disableMicrophoneProtection();
  disableCameraProtection();

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

/* PROXY SERVER PINGING FUNCTIONALITY */

var hourlyUpdateInterval = 4;
setInterval(function() {
  if (!serverArr.length) { return; }
  loadProxies();
}, hourlyUpdateInterval * 60 * 60 *1000);

var min = arr => arr.reduce( ( p, c ) => { return ( p < c ? p : c ); } );

function getServerLatencyList(servers, runs, accountType) {
  return Promise.all(servers.map(server => {
    // Ensure that server is available. If server is premium user must have premium account
    var serverHasIp = server.httpDefault.length;
    var serverLevelValid = server.level === 'free';
    if (server.level === 'premium' && accountType !== 'free') { serverLevelValid = true; }

    if (serverHasIp && serverLevelValid) {
      var promises = [];
      for (var i = 0; i < runs; i++) { promises.push(getLatency(server.ovHostname, 1)); }

      return Promise.all(promises)
      .then((pings) => {
        return { id: server.id, latency: min(pings) };
      });
    }
    else { return Promise.resolve({ id: server.id, latency: 9999 }); }
  }))
  .then(latencyList => {
    return latencyList.sort((a, b) => { return a.latency - b.latency; });
  })
  .then(function(latencyList) {
    // Keep old list if latency is high for every server
    if (latencyList[0].latency < 9999) {
      localStorage.setItem(LATENCY_LIST, JSON.stringify(latencyList));
    }
    chrome.runtime.sendMessage({ action: "ServersUpdated", latencyList: latencyList });
    return latencyList;
  });
}

function requestImage(url) {
  url = 'https://' + url + ':443';
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.onload = () => { resolve(img); };
    img.onerror = () => { reject(url); };
    img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
  });
}

function getLatency(url, multiplier) {
  return new Promise((resolve) => {
    var start = (new Date()).getTime();
    var response = () => {
        var delta = ((new Date()).getTime() - start);
        delta *= (multiplier || 1);
        resolve(delta);
    };

    requestImage(url).then(response).catch(response);

    // If request times out set latency high, so it's low on the list
    setTimeout(() => { resolve(99999); }, 4000);
  });
}


/* Apply Proxy PAC Script */

function applyProxy() {
  var config = localStorage.getItem(PAC_SCRIPT_CONFIG);
  if (!config) { return; }
  var pacScript = JSON.parse(config).pacScript.data;
  console.log('Applying PacScript in BG', pacScript);
  chrome.runtime.sendMessage({ action: 'SetPACScript', pacScript: pacScript });
}

function disableProxy() {
  console.log('Disabling Proxy');
  chrome.runtime.sendMessage({ action: 'ResetPACScript' });
}

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      callback(xmlHttp.responseText);
    }
  };
  xmlHttp.open('GET', theUrl, true); // true for asynchronous
  xmlHttp.send(null);
}

function saveServerArray(servers) {
  var order = {};

  for (var i = 0; i < regionOrder.length; i++) {
    order[regionOrder[i]] = i + 1;
  }

  var serverArr = [];
  var serverKeys = Object.keys(servers);
  serverKeys.forEach((key) => { serverArr.push(servers[key]); });

  // Sort By Region, Country, Name
  serverArr.sort((a,b) => {
    if (order[a.region] < order[b.region]) { return -1; }
    if (order[a.region] > order[b.region]) { return 1; }
    if (a.country < b.country) { return -1; }
    if (a.country > b.country) { return 1; }
    if (a.name < b.name) { return -1; }
    if (a.name > b.name) { return 1; }
    return 0;
  });

  localStorage.setItem(PROXY_SERVERS_ARR, JSON.stringify(serverArr));
  return serverArr;
}

function loadProxies() {
  // Block auth popup dialog when connected to proxy
  httpGetAsync('https://cypherpunk.privacy.network/api/v0/account/status', (res) => {
    res = JSON.parse(res);
    authUsername = res.privacy.username;
    authPassword = res.privacy.password;
    chrome.runtime.sendMessage({ action: 'ProxyAuth', authUsername: authUsername, authPassword: authPassword });
    localStorage.setItem(PREMIUM_ACCOUNT, JSON.stringify(res.account.type === 'premium'));
    localStorage.setItem(ACCOUNT_TYPE, res.account.type);

    httpGetAsync('https://cypherpunk.privacy.network/api/v0/location/list/' + res.account.type, (servers) => {
      console.log('servers: ' + servers);
      localStorage.setItem(PROXY_SERVERS, servers);
      getServerLatencyList(saveServerArray(JSON.parse(servers)), 3, res.account.type);
      console.log('SERVERS SAVED', res.account.type);
    });
  });
}


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
    if (headers[i].name === 'User-Agent' || headers[i].name === 'user-agent') {
      if (userAgentString !== 'false') {
        headers[i].value = JSON.parse(userAgentString) || headers[i].value;
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

function cancelRequest(details) {
  // firefox has the originUrl in the details,
  // so keeping track of tabs is unnecessary
  if (!details.originUrl) { return { cancel: false }; }

  // check list based on global boolean values
  var outgoingUrl = details.url;
  var adListFound = false;
  if (globalBlockAds) {
    adListFound = !!adList.find(function(adUrl) {
      return outgoingUrl.indexOf(adUrl) !==1;
    });
  }

  var malwareListFound = false;
  if (globalBlockMalware) {
    malwareListFound = !!malwareList.find(function(malwareUrl) {
      return outgoingUrl.indexOf(malwareUrl) !==1;
    });
  }

  return { cancel: adListFound || malwareListFound };
}

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
}


/** Microphone Protection **/

function enableMicrophoneProtection() {
  chrome.contentSettings.microphone.set({
    primaryPattern: '<all_urls>',
    setting: 'block'
  });
}

function disableMicrophoneProtection() {
  chrome.contentSettings.microphone.set({
    primaryPattern: '<all_urls>',
    setting: 'ask'
  });
}


/** Camera Protection **/

function enableCameraProtection() {
  chrome.contentSettings.camera.set({
    primaryPattern: '<all_urls>',
    setting: 'block'
  });
}

function disableCameraProtection() {
  chrome.contentSettings.camera.set({
    primaryPattern: '<all_urls>',
    setting: 'ask'
  });
}

/* Event Listener Triggers */
chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === 'CypherpunkEnabled') {
    console.log('cypher enabled');
    cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === 'true';
    // Cypherpunk is turned on, enable features based on settings
    if (cypherpunkEnabled) { init(); }
    // Cypherpunk is turned off, disable all features
    else { destroy(); }
  }
  else if (request.action === 'UserAgentSpoofing') {
    userAgentString = localStorage.getItem(USER_AGENT_STRING);
    if (userAgentString) { enableUserAgentSpoofing(); }
    else { disableUserAgentSpoofing(); }
  }
  else if (request.action === 'updatePrivacyFilter') {
    globalBlockAds = JSON.parse(localStorage.getItem(PRIVACY_FILTER_ADS));
    globalBlockMalware = JSON.parse(localStorage.getItem(PRIVACY_FILTER_MALWARE));
    if (globalBlockAds || globalBlockMalware) { enablePrivacyFilter(); }
    else { disablePrivacyFilter(); }
  }
  else if (request.action === 'updateMicrophoneProtection') {
    microphoneProtection = JSON.parse(localStorage.getItem(MICROPHONE_PROTECTION));
    if (microphoneProtection) { enableMicrophoneProtection(); }
    else { disableMicrophoneProtection(); }
  }
  else if (request.action === 'updateCameraProtection') {
    cameraProtection = JSON.parse(localStorage.getItem(CAMERA_PROTECTION));
    if (cameraProtection) { enableCameraProtection(); }
    else { disableCameraProtection(); }
  }

});

/* Clear cache on url change so ip doesn't leak from previous site */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'loading') {
    chrome.runtime.sendMessage({ action: 'ClearCache' });
  }
});

// Remove proxy and settings upon uninstall
chrome.management.onUninstalled.addListener((extId) => {
  if (extId === chrome.runtime.id) { destroy(); }
});
