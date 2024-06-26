var self = require("sdk/self");

const webExtension = require("sdk/webextension");
var base64 = require('sdk/base64');
var ref = require('chrome'), Cc = ref.Cc, Ci = ref.Ci;
var observerSvc = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
var cacheStorageSvc = Cc['@mozilla.org/network/cache-storage-service;1'].getService(Ci.nsICacheStorageService);
var preferences = require('sdk/preferences/service');
var PRIVACY_USERNAME = 'cypherpunk.privacy.username';
var PRIVACY_PASSWORD = 'cypherpunk.privacy.password';
var privacyUsername = JSON.parse(localStorage.getItem(PRIVACY_USERNAME));
var privacyPassword = JSON.parse(localStorage.getItem(PRIVACY_PASSWORD));

exports.onUnload = function (reason) {
  console.log('Tear down', reason);
  resetPACScript();
  removeRequestObserver();
  disableWebRTCLeakProtection();
};

/** Block Proxy Auth Dialog **/
var headers = [];

var authObs = {
  observe: function(subject, topic) {
    if (topic !== 'http-on-modify-request') { return; }
    var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
    return httpChannel.setRequestHeader.apply(null, headers[0]);
  }
};

addRequestObserver();

function createProxyAuthHeader() {
  var credentials = base64.encode(privacyUsername + ":" + privacyPassword);
  headers[0] = ['Proxy-Authorization', "Basic " + credentials, false];
  return;
}

function addRequestObserver() {
  removeRequestObserver();
  return observerSvc.addObserver(authObs, 'http-on-modify-request', false);
}

function removeRequestObserver() {
  try { return observerSvc.removeObserver(authObs, 'http-on-modify-request'); }
  catch (err) { console.log('Authorization observer not present'); }
}

function resetPACScript() {
  console.log('Reseting Proxy Settings');
  removeRequestObserver();
  preferences.reset('network.proxy.type');
  preferences.reset('network.proxy.autoconfig_url');
}

function disableWebRTCLeakProtection() {
  console.log('Disabling WebRTC Leak Protection');
  preferences.reset("media.peerconnection.enabled");
  preferences.reset("media.peerconnection.turn.disable");
  preferences.reset("media.peerconnection.use_document_iceservers");
  preferences.reset("media.peerconnection.video.enabled");
  preferences.reset("media.peerconnection.default_iceservers");
}

webExtension.startup().then(api => {
  const {browser} = api;

  console.log('In FireFox SDK Script');

  browser.runtime.onMessage.addListener(function(request) {
    if (request.action === "ProxyAuth") {
      privacyUsername = request.privacyUsername;
      privacyPassword = request.privacyPassword;
      createProxyAuthHeader();
    }
    else if (request.action === "ClearCache") { cacheStorageSvc.clear(); }
    else if (request.action === "SetPACScript") {
      console.log('Applying Proxy Settings');
      var pac = request.pacScript;
      var pacUri = 'data:text/javascript,' + encodeURIComponent(pac);
      preferences.set('network.proxy.type', 2);
      preferences.set('network.proxy.autoconfig_url', pacUri);
    }
    else if (request.action === "ResetPACScript") { resetPACScript(); }
    else if (request.action === "EnableWebRTCLeakProtection") {
      console.log('Enabling WebRTC Leak Protection');
      preferences.set("media.peerconnection.enabled", false);
      preferences.set("media.peerconnection.turn.disable", true);
      preferences.set("media.peerconnection.ice.loopback", false);
      preferences.set("media.peerconnection.use_document_iceservers", false);
      preferences.set("media.peerconnection.video.enabled", false);
      preferences.set("media.peerconnection.default_iceservers", '[]');
    }
    else if (request.action === "DisableWebRTCLeakProtection") {
      disableWebRTCLeakProtection();
    }
  });

});
