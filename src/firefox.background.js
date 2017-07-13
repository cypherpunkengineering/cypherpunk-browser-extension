// background script variables
var chrome = chrome ? chrome : null;
var regionOrder = ['DEV', 'NA', 'SA', 'CR', 'EU', 'ME', 'AF', 'AS', 'OP'];
var adList = window.adList;
var malwareList = window.malwareList;
var forceHttpsList = window.forcehttps;

var ENABLED = 'cypherpunk.enabled';
var LATENCY_LIST = 'cypherpunk.latencyList';
var PROXY_SERVERS = 'cypherpunk.proxyServers';
var PREMIUM_ACCOUNT = 'cypherpunk.premiumAccount';
var PROXY_SERVERS_ARR = 'cypherpunk.proxyServersArr';
var PAC_SCRIPT_CONFIG = 'cypherpunk.pacScriptConfig';
var USER_AGENT_STRING = 'cypherpunk.settings.userAgent.string';
var WEB_RTC_LEAK_PROTECTION = 'cypherpunk.settings.ffWebRTCLeakProtection';
var PRIVACY_FILTER_ADS = 'cypherpunk.settings.privacyFilter.blockAds';
var PRIVACY_FILTER_MALWARE = 'cypherpunk.settings.privacyFilter.blockMalware';
var FORCE_HTTPS = 'cypherpunk.settings.forceHttps';

var ACCOUNT_ID = 'cypherpunk.account.id';
var ACCOUNT_EMAIL = 'cypherpunk.account.email';
var ACCOUNT_CONFIRMED = 'cypherpunk.account.confirmed';
var ACCOUNT_TYPE = 'cypherpunk.account.type';
var PRIVACY_USERNAME = 'cypherpunk.privacy.username';
var PRIVACY_PASSWORD = 'cypherpunk.privacy.password';
var SECRET = 'cypherpunk.secret';
var SUBSCRIPTION_ACTIVE = 'cypherpunk.subscription.active';
var SUBSCRIPTION_EXPIRATION = 'cypherpunk.subscription.expiration';
var SUBSCRIPTION_RENEWAL = 'cypherpunk.subscription.renewal';
var SUBSCRIPTION_RENEWS = 'cypherpunk.subscription.renews';
var SUBSCRIPTION_TYPE = 'cypherpunk.subscription.type';

// variables from localStorage
var userAgentString = localStorage.getItem(USER_AGENT_STRING);
var cypherpunkEnabled = localStorage.getItem(ENABLED) === "true";
var serverArr = JSON.parse(localStorage.getItem(PROXY_SERVERS_ARR));
var globalBlockAds = JSON.parse(localStorage.getItem(PRIVACY_FILTER_ADS));
var globalBlockMalware = JSON.parse(localStorage.getItem(PRIVACY_FILTER_MALWARE));
var webRTCLeakProtectionEnabled = localStorage.getItem(WEB_RTC_LEAK_PROTECTION) === 'true';
var forceHttps = JSON.parse(localStorage.getItem(FORCE_HTTPS));

var accountId = JSON.parse(localStorage.getItem(ACCOUNT_ID));
var accountEmail = JSON.parse(localStorage.getItem(ACCOUNT_EMAIL));
var accountConfirmed = JSON.parse(localStorage.getItem(ACCOUNT_CONFIRMED));
var accountType = JSON.parse(localStorage.getItem(ACCOUNT_TYPE));
var privacyUsername = JSON.parse(localStorage.getItem(PRIVACY_USERNAME));
var privacyPassword = JSON.parse(localStorage.getItem(PRIVACY_PASSWORD));
var secret = JSON.parse(localStorage.getItem(SECRET));
var subscriptionActive = JSON.parse(localStorage.getItem(SUBSCRIPTION_ACTIVE));
var subscriptionExpiration = JSON.parse(localStorage.getItem(SUBSCRIPTION_EXPIRATION));
var subscriptionRenewal = JSON.parse(localStorage.getItem(SUBSCRIPTION_RENEWAL));
var subscriptionRenews = JSON.parse(localStorage.getItem(SUBSCRIPTION_RENEWS));
var subscriptionType = JSON.parse(localStorage.getItem(SUBSCRIPTION_TYPE));


/** Start up code **/

// Enable Ad/Malware blocking
if (globalBlockAds || globalBlockMalware) { enablePrivacyFilter(); }
else { disablePrivacyFilter(); }

// Enable user agent spoofing if user agent string supplied
if (userAgentString) { enableUserAgentSpoofing(); }
else { disableUserAgentSpoofing(); }

// Enable/Disable WebRTC leak protection depending on saved setting
if (webRTCLeakProtectionEnabled) { enableWebRTCLeakProtection(); }
else { disableWebRTCLeakProtection(); }

// Enable force http if it's enabled
if (forceHttps) { enableForceHttps(); }
else { disableForceHttps(); }

// Apply Proxy
if (cypherpunkEnabled) { applyProxy(); }
else { disableProxy(); }

// Load user and servers on first run
loadUser().then(() => { loadProxies(); });

var hourlyUpdateInterval = 4;
setInterval(function() {
  loadUser();
  loadProxies();
}, hourlyUpdateInterval * 60 * 60 *1000);


/* USER FUNCTIONALITY */

function loadUser() {
  return new Promise((resolve, reject) => {
    httpGetAsync('https://api.cypherpunk.com/api/v1/account/status', (err, res) => {
      if (err) { return console.log(err); }

      res = JSON.parse(res);
      if (res.code && res.code >= 400) { return console.log(res); }

      accountId = setUserProp(ACCOUNT_ID, res.account.id);
      accountEmail = setUserProp(ACCOUNT_EMAIL, res.account.email);
      accountConfirmed = setUserProp(ACCOUNT_CONFIRMED, res.account.confirmed);
      accountType = setUserProp(ACCOUNT_TYPE, res.account.type);
      privacyUsername = setUserProp(PRIVACY_USERNAME, res.privacy.username);
      privacyPassword = setUserProp(PRIVACY_PASSWORD, res.privacy.password);
      secret = setUserProp(SECRET, res.secret);
      subscriptionActive = setUserProp(SUBSCRIPTION_ACTIVE, res.subscription.active);
      subscriptionExpiration = setUserProp(SUBSCRIPTION_EXPIRATION, res.subscription.expiration);
      subscriptionRenewal = setUserProp(SUBSCRIPTION_RENEWAL, res.subscription.renewal);
      subscriptionRenews = setUserProp(SUBSCRIPTION_RENEWS, res.subscription.renews);
      subscriptionType = setUserProp(SUBSCRIPTION_TYPE, res.subscription.type);

      // disable proxy on expired accounts
      if (!subscriptionActive){ disableProxy(); }

      // Update ProxyAuth headers
      chrome.runtime.sendMessage({ action: 'ProxyAuth', authUsername: privacyUsername, authPassword: privacyPassword });

      chrome.runtime.sendMessage({ action: "UserUpdated" });
      console.log('USER SAVED IN BACKGROUND');
      return resolve();
    });
  });
}

function setUserProp(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}


/* PROXY SERVER PINGING FUNCTIONALITY */

function loadProxies() {
  // quit if no account type found
  if (!accountType) { return; }

  // call to server to get list of locations
  httpGetAsync('https://api.cypherpunk.com/api/v1/location/list/' + accountType, (err, res) => {
    if (err) { return console.log(err); }

    // save location objects
    localStorage.setItem(PROXY_SERVERS, res);
    console.log('SAVED LOCATIONS OBJECT', res);

    // sort servers by region
    serverArr = sortServerArray(JSON.parse(res));
    localStorage.setItem(PROXY_SERVERS_ARR, JSON.stringify(serverArr));
    console.log('SAVED SORTED SERVER ARRAY', serverArr);

    // generate latency list for all servers
    // saves latency list and send ServersUpdated message to extension
    getServerLatencyList(serverArr, 3, accountType);
    console.log('SAVING SERVERS FINISHED', accountType);
  });
}

function sortServerArray(servers) {
  var order = {};
  for (var i = 0; i < regionOrder.length; i++) {
    order[regionOrder[i]] = i + 1;
  }

  var serverArr = [];
  Object.keys(servers).forEach((key) => { serverArr.push(servers[key]); });

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

  return serverArr;
}

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

      var min = arr => arr.reduce( ( p, c ) => { return ( p < c ? p : c ); } );
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
      console.log('SAVED LATENCY LIST', latencyList);
    }
    chrome.runtime.sendMessage({ action: "ServersUpdated", latencyList: latencyList });
    return latencyList;
  });
}

function getLatency(url, multiplier) {
  return new Promise((resolve) => {
    var start = (new Date()).getTime();
    var imageUrl = 'https://' + url + ':443';
    var response = () => {
        var delta = ((new Date()).getTime() - start);
        delta *= (multiplier || 1);
        resolve(delta);
    };

    new Promise((innerResolve, innerReject) => {
      var img = new Image();
      img.onload = () => { innerResolve(img); };
      img.onerror = () => { innerReject(img); };
      img.src = imageUrl + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
    })
    .then(response)
    .catch(response);

    // If request times out set latency high, so it's low on the list
    setTimeout(() => { resolve(99999); }, 4000);
  });
}


/* Apply Proxy PAC Script */

function applyProxy() {
  var config = localStorage.getItem(PAC_SCRIPT_CONFIG);
  if (!config) {
    cypherpunkEnabled = false;
    localStorage.setItem(ENABLED, false);;
    return disableProxy();
  }
  var pacScript = JSON.parse(config).pacScript.data;
  console.log('Applying PacScript in BG', pacScript);
  chrome.runtime.sendMessage({ action: 'SetPACScript', pacScript: pacScript });

  // Set icon to blue Cypherpunk
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

function disableProxy() {
  console.log('Disabling Proxy');
  chrome.runtime.sendMessage({ action: 'ResetPACScript' });

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


/** Force HTTPS */
function redirectRequest(details) {
  // allow request from other extensions and if tab is not recognized
  if (details.tabId < 0) { return { cancel: false }; }
  if (!tabs[details.tabId]) { return { cancel: false }; }
  if (details.url.startsWith('https')) { return { cancel: false }; }

  // Check list based on global boolean values
  var outgoingUrl = details.url;
  var forceHttpsListFound = false;
  if (forceHttps) {
    forceHttpsListFound = !!forceHttpsList.find(function(url) {
      return outgoingUrl.indexOf(url) !== 1;
    });
  }

  if (forceHttpsListFound) {
    return { redirectUrl: details.url.replace(/^http:\/\//i, 'https://') };
  }
  else { return { cancel: false }; }
}

function enableForceHttps() {
  disableForceHttps();
  console.log('Enabling Force HTTPS');
  chrome.webRequest.onBeforeRequest.addListener(
    redirectRequest,
    { urls:['<all_urls>'] },
    ['blocking']
  );
}

function disableForceHttps() {
  console.log('Disabling Force HTTPS');
  chrome.webRequest.onBeforeRequest.removeListener(redirectRequest);
}


/* Event Listener Triggers */
chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === 'CypherpunkEnabled') {
    console.log('cypher enabled');
    cypherpunkEnabled = localStorage.getItem(ENABLED) === 'true';
    if (cypherpunkEnabled) { applyProxy(); }
    else { disableProxy(); }
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
  else if (request.action === "updateForceHTTPS"){
    forceHttps = JSON.parse(localStorage.getItem(FORCE_HTTPS));
    if (forceHttps) { enableForceHttps(); }
    else { disableForceHttps(); }
  }
});

/* Clear cache on url change so ip doesn't leak from previous site */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'loading') {
    chrome.runtime.sendMessage({ action: 'ClearCache' });
  }
});

function destroy() {
  disableForceHttps();
  disableProxy(); // Disable PAC Script
  disableUserAgentSpoofing(); // Disable user agent spoofing
  disableWebRTCLeakProtection(); // Disable webRTC leak protection
  disablePrivacyFilter(); // Disable proxy filter onWebRequest
}

/* Utils */

function httpGetAsync(theUrl, callback) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', () => { callback(null, xhr.responseText); });
  xhr.addEventListener('error', () => { callback(error); })
  xhr.open("GET", theUrl); // true for asynchronous
  xhr.send(null);
}
