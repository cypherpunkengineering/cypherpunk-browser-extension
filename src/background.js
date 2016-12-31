var cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
//var forceHttps = localStorage.getItem('cypherpunk.settings.forceHttps') === "true";
var privacyFilterEnabled = localStorage.getItem('cypherpunk.settings.privacyFilter.enabled') === "true";
var userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');

var authUsername, authPassword;




/* Apply Proxy PAC Script */

function applyProxy(pacScript) {
  console.log('Enabling Proxy');
  chrome.proxy.settings.set({value: pacScript, scope: 'regular'});
}

function disableProxy() {
  console.log('Disabling Proxy');
  applyProxy({ mode: "system" });
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // 1) Get the domain of url
  // 2) Check against local storage to see proxy type
  // 3) If url doesnt exist in local storage, apply selected default proxy option
  // 4) If url does exist apply saved proxy setting

  var url = tab.url;
  console.log('Cypherpunk is enabled', cypherpunkEnabled);
  if (cypherpunkEnabled && url && url !== undefined && changeInfo.status == "complete") {

    var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

    var routing = localStorage.getItem('cypherpunk.routing');
    routing = JSON.parse(routing);
    var routingSetting = routing[domain];

    var proxyServers = localStorage.getItem('cypherpunk.proxyServers');
    proxyServers = JSON.parse(proxyServers);

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
    else if (routingType === 'CLOSEST') {
      console.log('USING CLOSEST PROXY');

      // LOOK at latency list grab first server
      var latencyList = JSON.parse(localStorage.getItem('cypherpunk.latencyList'));
      selectedProxy = proxyServers[latencyList[0].id];
    }
    else {
      console.log('USING SMART PROXY');

      var tld = url.match(/[.](jp|com)/);
      tld = tld && tld.length ? tld[0] : null;
      var serverId;
      // Default to central US server for .com
      // Default to tokyo for .jp
      if (tld === '.com' || !tld) {
        serverId = 'dallas';
      }
      else if (tld === '.jp') {
        serverId = 'london'; // TODO: CHANGE TO TOKYO WHEN PROXY IS AVAILABLE
      }
      selectedProxy = proxyServers[serverId];
    }

    if (selectedProxy) {
      console.log('SELECTED PROXY IS:', selectedProxy);
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
      console.log('PAC Script Config:', JSON.stringify(config, null, 2));
      applyProxy(config);
    }
    else {
      console.log('SELECTED PROXY IS: NO PROXY');
      disableProxy();
    }

  }
  else { disableProxy(); }
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

function init() {
  // Block auth popup dialog when connected to proxy
  httpGetAsync('https://cypherpunk.com/api/v0/account/status', function(res) {
    res = JSON.parse(res)
    authUsername = res.privacy.username;
    authPassword = res.privacy.password;

    enableProxyAuthCredentials();
  });

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
  else if (request.action === 'ApplyProxy') {
    applyProxy(request.pacScript);
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

