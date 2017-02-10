var cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
var privacyFilterEnabled = localStorage.getItem('cypherpunk.settings.privacyFilter.enabled') === "true";
var userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');

var webRTCLeakProtectionType = JSON.parse(localStorage.getItem('cypherpunk.settings.webRTCLeakProtection'));

var authUsername, authPassword;

// Remove proxy and settings upon uninstall
chrome.management.onUninstalled.addListener(() => { destroy(); });

/* PROXY SERVER PINGING FUNCTIONALITY */
var serverArr = JSON.parse(localStorage.getItem('cypherpunk.proxyServersArr'));

function updateProxies() {
  if (!serverArr.length) { return; }
  loadProxies();
}
var hourlyUpdateInterval = 4;
setInterval(updateProxies, hourlyUpdateInterval * 60 * 60 *1000);

var min = arr => arr.reduce( ( p, c ) => { return ( p < c ? p : c ); } );

function getServerLatencyList(servers, runs, premium) {
  return Promise.all(servers.map(server => {
    // Ensure that server is available. If server is premium user must have premium account
    if (server.httpDefault.length && (server.level === 'premium' && premium || server.level === 'free')) {
      var promises = [];
      for (var i = 0; i < runs; i++) { promises.push(this.getLatency(server.ovHostname, 1)); }

      return Promise.all(promises)
      .then((pings) => {
        return { id: server.id, latency: this.min(pings) };
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
      localStorage.setItem('cypherpunk.latencyList', JSON.stringify(latencyList));
    }
    chrome.runtime.sendMessage({ action: "ServersUpdated", latencyList: latencyList });
    return latencyList;
  });
}

function requestImage(url) {
  url = 'https://' + url + ':3128';
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.onload = () => { resolve(img); };
    img.onerror = () => { reject(url); };
    img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
  });
}

function getLatency(url, multiplier) {
  return new Promise((resolve, reject) => {
    var start = (new Date()).getTime();
    var response = () => {
        var delta = ((new Date()).getTime() - start);
        delta *= (multiplier || 1);
        resolve(delta);
    };

    this.requestImage(url).then(response).catch(response);

    // If request times out set latency high, so it's low on the list
    setTimeout(() => { resolve(99999); }, 4000);
  });
}

/* Apply Proxy PAC Script */
function applyProxy() {
  var config = localStorage.getItem("cypherpunk.pacScriptConfig");
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
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      callback(xmlHttp.responseText);
    }
  }
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

  localStorage.setItem('cypherpunk.proxyServersArr', JSON.stringify(serverArr));
  return serverArr;
}

function loadProxies() {
  // Block auth popup dialog when connected to proxy
  httpGetAsync('https://cypherpunk.privacy.network/api/v0/account/status', (res) => {
    res = JSON.parse(res)
    authUsername = res.privacy.username;
    authPassword = res.privacy.password;
    enableProxyAuthCredentials();
    localStorage.setItem('cypherpunk.premiumAccount', JSON.stringify(res.account.type === 'premium'));

    httpGetAsync('https://cypherpunk.privacy.network/api/v0/location/list/' + res.account.type, (servers) => {
      localStorage.setItem('cypherpunk.proxyServers', servers);
      getServerLatencyList(saveServerArray(JSON.parse(servers)), 3, res.account.type);
      console.log('SERVERS SAVED', res.account.type);
    });
  });
}

// Clear cache on url change so ip doesnt leak from previous site
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') {
    if (chrome.browsingData) {
      chrome.browsingData.removeCache();
    }
  }
});

function init() {
  applyProxy();
  loadProxies();
  // Enable force http if it's enabled
  // if (forceHttps) { enableForceHttps(); }
  // else { disableForceHttps(); }

  // Enable user agent spoofing if user agent string supplied
  userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');
  if (userAgentString) { enableUserAgentSpoofing(); }
  else { disableUserAgentSpoofing(); }

  webRTCLeakProtectionType = JSON.parse(localStorage.getItem('cypherpunk.settings.webRTCLeakProtection'));
  if (webRTCLeakProtectionType) { updateWebRTCLeakProtection(webRTCLeakProtectionType); }
  else { updateWebRTCLeakProtection('DEFAULT'); }

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
  disablePrivacyFilter();
  disableProxy();
  updateWebRTCLeakProtection('DEFAULT');
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

if (cypherpunkEnabled) { init(); }
else {
  // Try to load servers even if cypherpunk is not enabled
  loadProxies();
  destroy();
}

// Event Listener Triggers
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (request.action === "CypherpunkEnabled"){
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
  else if (request.action === "UpdateWebRTCPolicy") {
    if (!cypherpunkEnabled) { return; }
    webRTCLeakProtectionType = JSON.parse(localStorage.getItem('cypherpunk.settings.webRTCLeakProtection'));
    updateWebRTCLeakProtection(webRTCLeakProtectionType);
  }
  // else if (request.action === 'PrivacyFilter') {
  //   cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
  //   if (!cypherpunkEnabled) { return; }
  //   // Reload current tab to update blocked requests
  //   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //     chrome.tabs.reload(tabs[0].id);
  //   });
  // }
  // else if (request.action === "ForceHTTPS"){
  //   forceHttps = localStorage.getItem('cypherpunk.settings.forceHttps') === "true"
  //   if (forceHttps) { enableForceHttps(); }
  //   else { disableForceHttps(); }
  //   sendResponse({ forceHttps: forceHttps });
  // }
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
    if( headers[i].name == 'User-Agent' ) {
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
    if (!tab || !tab.url) { return; }
    var url = tab.url;

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

var regionOrder = [
  "DEV",
  "NA",
  "SA",
  "CR",
  "EU",
  "ME",
  "AF",
  "AS",
  "OP"
];

var regions = {
  "NA": "North America",
  "SA": "Central & South America",
  "CR": "Caribbean",
  "OP": "Oceania & Pacific",
  "EU": "Europe",
  "ME": "Middle East",
  "AF": "Africa",
  "AS": "Asia & India Subcontinent",
  "DEV": "Development"
};
