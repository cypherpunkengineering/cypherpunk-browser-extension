var authUsername, authPassword;
var userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');

// Event Listener Triggers
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

loadProxies();

function init() {
  console.log('INIT!');

  loadProxies();

  // Enable user agent spoofing if user agent string supplied
  var userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');
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
  console.log('DESTROY!');
  disableUserAgentSpoofing();
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


/** User Agent Spoofing **/
function spoofUserAgent(details) {
  var headers = details.requestHeaders;
  if (!userAgentString) return;
  for (var i = 0, l = headers.length; i < l; ++i) {
    console.log(headers[i].name);
    if (headers[i].name === 'User-Agent' || headers[i].name === 'user-agent' ) {
      console.log('IN HERE!');
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
