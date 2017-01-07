var cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
//var forceHttps = localStorage.getItem('cypherpunk.settings.forceHttps') === "true";
var privacyFilterEnabled = localStorage.getItem('cypherpunk.settings.privacyFilter.enabled') === "true";
var userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');

var authUsername, authPassword;

// Remove proxy and settings upon uninstall
chrome.management.onUninstalled.addListener(() => {
  destroy();
});

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

function disableProxy() {
  console.log('Disabling Proxy');
  chrome.proxy.settings.set({value: { mode: "system" }, scope: 'regular'});
}

function applyPACScript() {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){

    // 1) Get the domain of url
    // 2) Check against local storage to see proxy type
    // 3) If url doesnt exist in local storage, apply selected default proxy option
    // 4) If url does exist apply saved proxy setting

    if (!tabs.length) { return; }
    var url = tabs[0].url;
    console.log('Cypherpunk is enabled', cypherpunkEnabled);
    if (cypherpunkEnabled && url && url !== undefined) {

      var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

      var routing = JSON.parse(localStorage.getItem('cypherpunk.routing'));
      var routingSetting = routing[domain];

      var proxyServers = JSON.parse(localStorage.getItem('cypherpunk.proxyServers'));
      var latencyList = JSON.parse(localStorage.getItem('cypherpunk.latencyList'));

      var defaultRoutingType = JSON.parse(localStorage.getItem('cypherpunk.settings.defaultRouting.type'));
      var routingType = routingSetting ? routingSetting.type : defaultRoutingType;
      var selectedProxy;

      console.log('ROUTING TYPE IS:', routingType);

      if (routingType === 'SELECTED') {
        console.log('USING SELECTED PROXY');
        var defaultSelectedServerId = JSON.parse(localStorage.getItem('cypherpunk.settings.defaultRouting.selected'));
        // User has custom selection
        if (routingSetting && routingSetting.serverId) {
          selectedProxy = proxyServers[routingSetting.serverId];
        }
        // Default to selected server in settings
        else {
          selectedProxy = proxyServers[defaultSelectedServerId];
        }
      }
      else if (routingType === 'NONE') {
        console.log('USING NO PROXY');
        disableProxy();
      }
      else if (routingType === 'FASTEST') {
        console.log('USING FASTEST PROXY');

        // LOOK at latency list grab first server
        selectedProxy = proxyServers[latencyList[0].id];
      }
      else {
        console.log('USING SMART PROXY');
        selectedProxy = getSmartServer(url, proxyServers, latencyList);
      }

      if (selectedProxy) {
        console.log('SELECTED PROXY IS:', routingType, selectedProxy);
        var proxyIP = selectedProxy.httpDefault[0];
        var config = {
          mode: "pac_script",
          pacScript: {
            data: "function FindProxyForURL(url, host) {\n" +
                  generateDirectPingRules() +
                  "  if (shExpMatch(host, \"cypherpunk.com\")) return 'DIRECT';\n" +
                  "  if (shExpMatch(host, \"*.com\")) return 'PROXY " + proxyIP + ":80';\n" +
                  "  if (shExpMatch(host, \"*.jp\")) return 'PROXY " + proxyIP + ":80';\n" +
                  "  else return 'PROXY " + proxyIP + ":80';\n" +
                  "}"
          }
        };
        console.log('Enabling Proxy');
        chrome.proxy.settings.set({value: config, scope: 'regular'});
      }
      else {
        console.log('SELECTED PROXY IS: NO PROXY');
        disableProxy();
      }

    }
    else { disableProxy(); }
  });
}

function getSmartServer(domain, allServers, latencyList) {
  var smartServer;
  var fastestCountryServer = (country) => {
    var fastestServer, curServer, latency;
    // Find fastest server for given country
    for(var x = 0; x < latencyList.length; x++) {
      latency = latencyList[x].latency;
      curServer = allServers[latencyList[x].id];
      if (curServer.country === country && latency < 9999) {
        fastestServer = curServer;
        break;
      }
    }

    // All servers pinged 9999 or higher, default to fastest US server
    if (!fastestServer) {
      for(var y = 0; y < latencyList.length; y++) {
        latency = latencyList[y].latency;
        curServer = allServers[latencyList[y].id];
        if (curServer.country === 'US') {
          fastestServer = curServer;
          break;
        }
      }
    }
    return fastestServer;
  }

  var match = domain.match(/[.](au|br|ca|ch|de|fr|uk|hk|in|it|jp|nl|no|ru|se|sg|tr|com)/);
  var tld = match && match.length ? match[0] : null;
  // .au -> AU
  // .br -> BR
  // .ca -> CA
  // .ch -> CH
  // .de -> DE
  // .fr -> FR
  // .uk -> GB
  // .hk -> HK
  // .in -> IN
  // .it -> IT
  // .jp -> JP
  // .nl -> NL
  // .no -> NO
  // .ru -> RU
  // .se -> SE
  // .sg -> SG
  // .tr -> TR
  // else -> US
  if (tld === '.com') {
    smartServer = fastestCountryServer('US');
  }
  else if (tld === '.au') {
    smartServer = fastestCountryServer('AU');
  }
  else if (tld === '.br') {
    smartServer = fastestCountryServer('BR');
  }
  else if (tld === '.ca') {
    smartServer = fastestCountryServer('CA');
  }
  else if (tld === '.ch') {
    smartServer = fastestCountryServer('CH');
  }
  else if (tld === '.de') {
    smartServer = fastestCountryServer('DE');
  }
  else if (tld === '.uk') {
    smartServer = fastestCountryServer('GB');
  }
  else if (tld === '.hk') {
    smartServer = fastestCountryServer('HK');
  }
  else if (tld === '.in') {
    smartServer = fastestCountryServer('IN');
  }
  else if (tld === '.it') {
    smartServer = fastestCountryServer('IT');
  }
  else if (tld === '.jp') {
    smartServer = fastestCountryServer('JP');
  }
  else if (tld === '.nl') {
    smartServer = fastestCountryServer('NL');
  }
  else if (tld === '.no') {
    smartServer = fastestCountryServer('NO');
  }
  else if (tld === '.ru') {
    smartServer = fastestCountryServer('RU');
  }
  else if (tld === '.se') {
    smartServer = fastestCountryServer('SE');
  }
  else if (tld === '.sg') {
    smartServer = fastestCountryServer('SG');
  }
  else if (tld === '.tr') {
    smartServer = fastestCountryServer('TR');
  }
  else {
    smartServer = fastestCountryServer('US');
  }
  return smartServer;
}

// Apply pac script when tab is activated
chrome.tabs.onActivated.addListener(function() {
  applyPACScript();
});

// Apply pac script when tab url is changed
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') { // apply pac script while new url is loading
    applyPACScript();
  }
});

function generateDirectPingRules() {
  var rules = "";
  var serverArr = JSON.parse(localStorage.getItem('cypherpunk.proxyServersArr'));
  serverArr.forEach(function(server) {
    if (server.ovHostname) {
      rules += "if (shExpMatch(host, \"" + server.ovHostname + "\")) return 'DIRECT';\n";
    }
  });
  return rules;
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
  var regionOrder = { 'NA': 1, 'SA': 2, 'OP': 3, 'EU': 4, 'AS': 5 };

  var serverArr = [];
  var serverKeys = Object.keys(servers);
  serverKeys.forEach((key) => { serverArr.push(servers[key]); });

  // Sort By Region, Country, Name
  serverArr.sort((a,b) => {
    if (regionOrder[a.region] < regionOrder[b.region]) return -1;
    if (regionOrder[a.region] > regionOrder[b.region]) return 1;
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
  httpGetAsync('https://cypherpunk.com/api/v0/account/status', (res) => {
    res = JSON.parse(res)
    authUsername = res.privacy.username;
    authPassword = res.privacy.password;
    enableProxyAuthCredentials();
    localStorage.setItem('cypherpunk.premiumAccount', JSON.stringify(res.account.type === 'premium'));

    httpGetAsync('https://cypherpunk.com/api/v0/location/list/' + res.account.type, (servers) => {
      localStorage.setItem('cypherpunk.proxyServers', servers);
      getServerLatencyList(saveServerArray(JSON.parse(servers)), 3, res.account.type);
      console.log('SERVERS SAVED', res.account.type);
    });
  });
}

// Try to load servers even if cypherpunk is not enabled
if (!cypherpunkEnabled) {
  loadProxies();
}

function init() {

  loadProxies();

  // Enable force http if it's enabled
  // if (forceHttps) { enableForceHttps(); }
  // else { disableForceHttps(); }

  // Enable user agent spoofing if user agent string supplied
  if (userAgentString) { enableUserAgentSpoofing(); }
  else { disableUserAgentSpoofing(); }

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
else { destroy(); }

// Event Listener Triggers
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (request.action === "CypherpunkEnabled"){
    cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
    // Cypherpunk is turned on, enable features based on settings
    if (cypherpunkEnabled) { init(); }
    // Cypherpunk is turned off, disable all features
    else { destroy(); }
  }
  else if (request.action === 'ApplyPACScript') {
    applyPACScript();
  }
  else if (request.action === 'DisableProxy') {
    disableProxy();
  }
  else if (request.action === 'UserAgentSpoofing') {
    userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');
    if (userAgentString) { enableUserAgentSpoofing(); }
    else { disableUserAgentSpoofing(); }
  }
  else if (request.action === 'PrivacyFilter') {
    cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
    if (!cypherpunkEnabled) { return; }
    // Reload current tab to update blocked requests
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  }
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

