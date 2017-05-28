// background script variables
var tabs = {};
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
var WEB_RTC_LEAK_PROTECTION = 'cypherpunk.settings.webRTCLeakProtection';
var PRIVACY_FILTER_ADS = 'cypherpunk.settings.privacyFilter.blockAds';
var PRIVACY_FILTER_MALWARE = 'cypherpunk.settings.privacyFilter.blockMalware';
var MICROPHONE_PROTECTION = 'cypherpunk.microphoneProtection';
var CAMERA_PROTECTION = 'cypherpunk.cameraProtection';
var LOCATION_PROTECTION = 'cypherpunk.locationProtection';
var FLASH_PROTECTION = 'cypherpunk.flashProtection';

// variables from localStorage
var userAgentString = localStorage.getItem(USER_AGENT_STRING);
var cypherpunkEnabled = localStorage.getItem(ENABLED) === "true";
var serverArr = JSON.parse(localStorage.getItem(PROXY_SERVERS_ARR));
var webRTCLeakProtectionType = JSON.parse(localStorage.getItem(WEB_RTC_LEAK_PROTECTION));
var globalBlockAds = JSON.parse(localStorage.getItem(PRIVACY_FILTER_ADS));
var globalBlockMalware = JSON.parse(localStorage.getItem(PRIVACY_FILTER_MALWARE));
var microphoneProtection = JSON.parse(localStorage.getItem(MICROPHONE_PROTECTION));
var cameraProtection = JSON.parse(localStorage.getItem(CAMERA_PROTECTION));
var locationProtection = JSON.parse(localStorage.getItem(LOCATION_PROTECTION));
var flashProtection = JSON.parse(localStorage.getItem(FLASH_PROTECTION));


/** Start up code **/

// Enable Privacy Filter
if (globalBlockAds || globalBlockMalware) { enablePrivacyFilter(); }
else { disablePrivacyFilter(); }

// Enable user agent spoofing if user agent string supplied
userAgentString = localStorage.getItem(USER_AGENT_STRING);
if (userAgentString) { enableUserAgentSpoofing(); }
else { disableUserAgentSpoofing(); }

// Enable Web RTC Leak Protection
webRTCLeakProtectionType = JSON.parse(localStorage.getItem(WEB_RTC_LEAK_PROTECTION));
if (webRTCLeakProtectionType) { updateWebRTCLeakProtection(webRTCLeakProtectionType); }
else { updateWebRTCLeakProtection('DEFAULT'); }

// Enable force http if it's enabled
// if (forceHttps) { enableForceHttps(); }
// else { disableForceHttps(); }

// Microphone protection
microphoneProtection = JSON.parse(localStorage.getItem(MICROPHONE_PROTECTION));
if (microphoneProtection) { enableMicrophoneProtection(); }
else { disableMicrophoneProtection(); }

// Camera protection
cameraProtection = JSON.parse(localStorage.getItem(CAMERA_PROTECTION));
if (cameraProtection) { enableCameraProtection(); }
else { disableCameraProtection(); }

// Location protection
locationProtection = JSON.parse(localStorage.getItem(LOCATION_PROTECTION));
if (locationProtection) { enableLocationProtection(); }
else { disableLocationProtection(); }

// Plugin protection
flashProtection = JSON.parse(localStorage.getItem(FLASH_PROTECTION));
if (flashProtection) { enableFlashProtection(); }
else { disableFlashProtection(); }

// save all the open tabs
chrome.tabs.query({}, function(results) {
  results.forEach(function(tab) { tabs[tab.id] = tab; });
});

if (cypherpunkEnabled) { init(); }
else {
  // Try to load servers even if cypherpunk is not enabled
  loadProxies();
  disableProxy();
}

function init() {
  applyProxy();  // Attempt to load PAC Script
  loadProxies(); // Attempt to fetch Proxy Servers

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
  disableProxyAuthCredentials();
  disableUserAgentSpoofing();
  // disableForceHttps();
  disableProxy();
  disablePrivacyFilter();
  updateWebRTCLeakProtection('DEFAULT');
  disableMicrophoneProtection();
  disableCameraProtection();
  disableLocationProtection();
  disableFlashProtection();

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
      for (var i = 0; i < runs; i++) {
        promises.push(getLatency(server.ovHostname, 1));
      }

      return Promise.all(promises)
      .then((pings) => { return { id: server.id, latency: min(pings) }; });
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
  config = JSON.parse(config);
  console.log('Applying PacScript in BG', config);
  chrome.proxy.settings.set({ value: config, scope: 'regular' });
}

function disableProxy() {
  console.log('Disabling Proxy');
  chrome.proxy.settings.set({value: { mode: "system" }, scope: 'regular'});
}

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      callback(xmlHttp.responseText);
    }
  };
  xmlHttp.open("GET", theUrl, true); // true for asynchronous
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
    if (order[a.region] < order[b.region]) return -1;
    if (order[a.region] > order[b.region]) return 1;
    if (a.country < b.country) return -1;
    if (a.country > b.country) return 1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
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
    enableProxyAuthCredentials();
    localStorage.setItem(PREMIUM_ACCOUNT, JSON.stringify(res.account.type === 'premium'));
    localStorage.setItem(ACCOUNT_TYPE, res.account.type);

    httpGetAsync('https://cypherpunk.privacy.network/api/v0/location/list/' + res.account.type, (servers) => {
      console.log('servers: ', servers);
      localStorage.setItem(PROXY_SERVERS, servers);
      getServerLatencyList(saveServerArray(JSON.parse(servers)), 3, res.account.type);
      console.log('SERVERS SAVED', res.account.type);
    });
  });
}


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


/** WebRTC Leak Prevention **/

function updateWebRTCLeakProtection(type) {
  var value = chrome.privacy.IPHandlingPolicy[type];
  console.log('Setting WebRTC Leak Prevention to ', value);
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value: value
  });
}


/** User Agent Spoofing **/

function spoofUserAgent(details) {
  var headers = details.requestHeaders;
  if (!userAgentString) return;
  for(var i = 0, l = headers.length; i < l; ++i) {
    if( headers[i].name === 'User-Agent' || headers[i].name === 'user-agent') {
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
  // allow request from other extensions and if tab is not recognized
  if (details.tabId < 0) { return { cancel: false }; }
  if (!tabs[details.tabId]) { return { cancel: false }; }

  // Check list based on global boolean values
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


/** Location Protection **/

function enableLocationProtection() {
  chrome.contentSettings.location.set({
    primaryPattern: '<all_urls>',
    setting: 'block'
  });
}

function disableLocationProtection() {
  chrome.contentSettings.location.set({
    primaryPattern: '<all_urls>',
    setting: 'ask'
  });
}


/** Plugin Protection **/

function enableFlashProtection() {
  chrome.contentSettings.plugins.getResourceIdentifiers((idents) => {
    idents.map((id) => {
      if (id.id === 'adobe-flash-player') {
        chrome.contentSettings.plugins.set({
          primaryPattern: '<all_urls>',
          resourceIdentifier: id,
          setting: 'block'
        });
      }
    });
  });
}

function disableFlashProtection() {
  chrome.contentSettings.plugins.getResourceIdentifiers((idents) => {
    idents.map((id) => {
      if (id.id === 'adobe-flash-player') {
        chrome.contentSettings.plugins.set({
          primaryPattern: '<all_urls>',
          resourceIdentifier: id,
          setting: 'ask'
        });
      }
    });
  });
}


// Event Listener Triggers
chrome.runtime.onMessage.addListener(function(request){
  if (request.action === 'CypherpunkEnabled'){
    console.log('cypher enabled');
    cypherpunkEnabled = localStorage.getItem(ENABLED) === 'true';
    if (cypherpunkEnabled) { init(); }
    else { disableProxy(); }
  }
  else if (request.action === 'UserAgentSpoofing') {
    userAgentString = localStorage.getItem(USER_AGENT_STRING);
    if (userAgentString) { enableUserAgentSpoofing(); }
    else { disableUserAgentSpoofing(); }
  }
  else if (request.action === "UpdateWebRTCPolicy") {
    webRTCLeakProtectionType = JSON.parse(localStorage.getItem(WEB_RTC_LEAK_PROTECTION));
    updateWebRTCLeakProtection(webRTCLeakProtectionType);
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
  else if (request.action === 'updateLocationProtection') {
    locationProtection = JSON.parse(localStorage.getItem(LOCATION_PROTECTION));
    if (locationProtection) { enableLocationProtection(); }
    else { disableLocationProtection(); }
  }
  else if (request.action === 'updateFlashProtection') {
    flashProtection = JSON.parse(localStorage.getItem(FLASH_PROTECTION));
    if (flashProtection) { enableFlashProtection(); }
    else { disableFlashProtection(); }
  }

  // else if (request.action === "ForceHTTPS"){
  //   forceHttps = localStorage.getItem('cypherpunk.settings.forceHttps') === "true"
  //   if (forceHttps) { enableForceHttps(); }
  //   else { disableForceHttps(); }
  //   sendResponse({ forceHttps: forceHttps });
  // }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // save tab on new tab
  tabs[tabId] = tab;

  // Clear cache on url change so ip doesnt leak from previous site
  if (changeInfo.status === 'loading' && chrome.browsingData) { chrome.browsingData.removeCache(); }
});

chrome.tabs.onRemoved.addListener(function(tabId) { delete tabs[tabId]; });

// Remove proxy and settings upon uninstall
chrome.management.onUninstalled.addListener((extId) => {
  if (extId === chrome.runtime.id) { destroy(); }
});

/** Force HTTPS */
// function redirectRequest(requestDetails) {
//   return { redirectUrl: requestDetails.url.replace(/^http:\/\//i, 'https://') };
// }

// function disableForceHttps() {
//   console.log('Disabling Force HTTPS');
//   chrome.webRequest.onBeforeRequest.removeListener(redirectRequest);
// }

// function enableForceHttps() {
//   disableForceHttps();
//   console.log('Enabling Force HTTPS');
//   chrome.webRequest.onBeforeRequest.addListener(
//     redirectRequest,
//     { urls:['http://*/*'] },
//     ['blocking']
//   );
// }
