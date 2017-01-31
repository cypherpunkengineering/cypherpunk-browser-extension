var cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
//var forceHttps = localStorage.getItem('cypherpunk.settings.forceHttps') === "true";
var privacyFilterEnabled = localStorage.getItem('cypherpunk.settings.privacyFilter.enabled') === "true";
var userAgentString = localStorage.getItem('cypherpunk.settings.userAgent.string');

var webRTCLeakProtectionType = JSON.parse(localStorage.getItem('cypherpunk.settings.webRTCLeakProtection'));

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
  var order = {};

  for (var i = 0; i < this.regionOrder.length; i++) {
    order[this.regionOrder[i]] = i + 1;
  }
  console.log(order);

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

// Clear cache on url change so ip doesnt leak from previous site
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') { // apply pac script while new url is loading
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
  else if (request.action === 'PrivacyFilter') {
    cypherpunkEnabled = localStorage.getItem('cypherpunk.enabled') === "true";
    if (!cypherpunkEnabled) { return; }
    // Reload current tab to update blocked requests
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  }
  else if (request.action === "UpdateWebRTCPolicy") {
    if (!cypherpunkEnabled) { return; }
    webRTCLeakProtectionType = JSON.parse(localStorage.getItem('cypherpunk.settings.webRTCLeakProtection'));
    updateWebRTCLeakProtection(webRTCLeakProtectionType);
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

var countries = {
  "US": "United States",
  "CA": "Canada",
  "MX": "Mexico",
  "AR": "Argentina",
  "BR": "Brazil",
  "CL": "Chile",
  "CO": "Colombia",
  "CR": "Costa Rica",
  "EC": "Ecuador",
  "GT": "Guatemala",
  "PA": "Panama",
  "PE": "Peru",
  "UY": "Uruguay",
  "VE": "Venezuela, Bolivarian Republic of",
  "BZ": "Belize",
  "BO": "Bolivia, Plurinational State of",
  "SV": "El Salvador",
  "GF": "French Guiana",
  "GY": "Guyana",
  "HN": "Honduras",
  "NI": "Nicaragua",
  "PY": "Paraguay",
  "SR": "Suriname",
  "AW": "Aruba",
  "BS": "Bahamas",
  "BB": "Barbados",
  "BM": "Bermuda",
  "DO": "Dominican Republic",
  "HT": "Haiti",
  "JM": "Jamaica",
  "PR": "Puerto Rico",
  "TT": "Trinidad and Tobago",
  "VI": "Virgin Islands, U.S.",
  "AI": "Anguilla",
  "AG": "Antigua and Barbuda",
  "BQ": "Bonaire, Sint Eustatius and Saba",
  "VG": "Virgin Islands, British",
  "KY": "Cayman Islands",
  "CW": "Curaçao",
  "DM": "Dominica",
  "GD": "Grenada",
  "GP": "Guadeloupe",
  "MQ": "Martinique",
  "MS": "Montserrat",
  "MF": "Saint Martin (French part)",
  "SX": "Sint Maarten (Dutch part)",
  "KN": "Saint Kitts and Nevis",
  "LC": "Saint Lucia",
  "VC": "Saint Vincent and the Grenadines",
  "TC": "Turks and Caicos Islands",
  "AS": "American Samoa",
  "AU": "Australia",
  "FJ": "Fiji",
  "GU": "Guam",
  "NZ": "New Zealand",
  "MP": "Northern Mariana Islands",
  "VU": "Vanuatu",
  "WF": "Wallis and Futuna",
  "CK": "Cook Islands",
  "PF": "French Polynesia",
  "MH": "Marshall Islands",
  "FM": "Micronesia, Federated States of",
  "NC": "New Caledonia",
  "PW": "Palau",
  "PG": "Papua New Guinea",
  "BE": "Belgium",
  "FR": "France",
  "DE": "Germany",
  "IT": "Italy",
  "ES": "Spain",
  "CH": "Switzerland",
  "NL": "Netherlands",
  "TR": "Turkey",
  "GB": "United Kingdom",
  "AL": "Albania",
  "AM": "Armenia",
  "AT": "Austria",
  "AZ": "Azerbaijan",
  "BY": "Belarus",
  "BA": "Bosnia and Herzegovina",
  "BG": "Bulgaria",
  "HR": "Croatia",
  "CY": "Cyprus",
  "CZ": "Czech Republic",
  "DK": "Denmark",
  "EE": "Estonia",
  "FO": "Faroe Islands",
  "FI": "Finland",
  "GE": "Georgia",
  "GI": "Gibraltar",
  "GR": "Greece",
  "GL": "Greenland",
  "HU": "Hungary",
  "IS": "Iceland",
  "IE": "Ireland",
  "KZ": "Kazakhstan",
  "LV": "Latvia",
  "LI": "Liechtenstein",
  "LT": "Lithuania",
  "LU": "Luxembourg",
  "MK": "Macedonia, the former Yugoslav Republic of",
  "MT": "Malta",
  "MD": "Moldova, Republic of",
  "MC": "Monaco",
  "ME": "Montenegro",
  "NO": "Norway",
  "PL": "Poland",
  "PT": "Portugal",
  "RO": "Romania",
  "RU": "Russian Federation",
  "SM": "San Marino",
  "RS": "Serbia",
  "SK": "Slovakia",
  "SI": "Slovenia",
  "SE": "Sweden",
  "TM": "Turkmenistan",
  "UA": "Ukraine",
  "UZ": "Uzbekistan",
  "VA": "Holy See (Vatican City State)",
  "BH": "Bahrain",
  "KW": "Kuwait",
  "OM": "Oman",
  "QA": "Qatar",
  "SA": "Saudi Arabia",
  "AE": "United Arab Emirates",
  "EG": "Egypt",
  "IR": "Iran, Islamic Republic of",
  "IQ": "Iraq",
  "IL": "Israel",
  "JO": "Jordan",
  "LB": "Lebanon",
  "SY": "Syrian Arab Republic",
  "YE": "Yemen",
  "BW": "Botswana",
  "KE": "Kenya",
  "MW": "Malawi",
  "MA": "Morocco",
  "MZ": "Mozambique",
  "NA": "Namibia",
  "NG": "Nigeria",
  "ZA": "South Africa",
  "SZ": "Swaziland",
  "ZM": "Zambia",
  "DZ": "Algeria",
  "AO": "Angola",
  "BJ": "Benin",
  "BF": "Burkina Faso",
  "BI": "Burundi",
  "CM": "Cameroon",
  "CV": "Cape Verde",
  "CF": "Central African Republic",
  "TD": "Chad",
  "CG": "Congo",
  "CD": "Congo, the Democratic Republic of the",
  "DJ": "Djibouti",
  "GQ": "Equatorial Guinea",
  "ER": "Eritrea",
  "ET": "Ethiopia",
  "GA": "Gabon",
  "GM": "Gambia",
  "GH": "Ghana",
  "GN": "Guinea",
  "GW": "Guinea-Bissau",
  "CI": "Côte d'Ivoire",
  "LS": "Lesotho",
  "LR": "Liberia",
  "LY": "Libya",
  "MG": "Madagascar",
  "ML": "Mali",
  "MR": "Mauritania",
  "MU": "Mauritius",
  "NE": "Niger",
  "RE": "Réunion",
  "RW": "Rwanda",
  "SN": "Senegal",
  "SC": "Seychelles",
  "SL": "Sierra Leone",
  "SO": "Somalia",
  "SD": "Sudan",
  "TZ": "Tanzania, United Republic of",
  "TG": "Togo",
  "TN": "Tunisia",
  "UG": "Uganda",
  "ZW": "Zimbabwe",
  "CN": "China",
  "HK": "Hong Kong",
  "IN": "India",
  "ID": "Indonesia",
  "JP": "Japan",
  "MY": "Malaysia",
  "PH": "Philippines",
  "SG": "Singapore",
  "KR": "Korea, Republic of",
  "TW": "Taiwan, Province of China",
  "TH": "Thailand",
  "AF": "Afghanistan",
  "BD": "Bangladesh",
  "BT": "Bhutan",
  "BN": "Brunei Darussalam",
  "KH": "Cambodia",
  "KG": "Kyrgyzstan",
  "LA": "Lao People's Democratic Republic",
  "MO": "Macao",
  "MV": "Maldives",
  "MN": "Mongolia",
  "NP": "Nepal",
  "PK": "Pakistan",
  "LK": "Sri Lanka",
  "VN": "Viet Nam"
};
