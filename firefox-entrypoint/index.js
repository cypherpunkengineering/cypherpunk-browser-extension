var self = require("sdk/self");

const webExtension = require("sdk/webextension");

webExtension.startup().then(api => {
  const {browser} = api;

  console.log('In FireFox Background Script');
  var preferences = require('sdk/preferences/service');
  var authUsername, authPassword;

  browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request);
    if (request.action === "ProxyAuth") {
      authUsername = request.authUsername;
      authPassword = request.authPassword;
      createProxyAuthHeader();
    }
    else if (request.action === "SetPACScript") {
      console.log('Setting PAC Script');
      var pac = request.pacScript;
      var pacUri = 'data:text/javascript,' + encodeURIComponent(pac);
      addRequestObserver();
      preferences.set('network.proxy.type', 2);
      preferences.set('network.proxy.autoconfig_url', pacUri);
    }
    else if (request.action === "ResetPACScript") {
      removeRequestObserver();
      preferences.reset('network.proxy.type');
      preferences.reset('network.proxy.autoconfig_url');
    }
  });

  /** Block Proxy Auth Dialog **/
  var headers = null;
  var ref = require('chrome'), Cc = ref.Cc, Ci = ref.Ci;
  var observerSvc = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
  var base64 = require('sdk/base64');

  var authObs = {
    observe: function(subject, topic, data) {
      if (topic !== 'http-on-modify-request') { return; }
      var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
      return httpChannel.setRequestHeader.apply(null, headers[0]);
    }
  };

  function createProxyAuthHeader() {
    credentials = base64.encode(authUsername + ":" + authPassword);
    return headers = [['Proxy-Authorization', "Basic " + credentials, false]];
  }

  function addRequestObserver() {
    removeRequestObserver();
    return observerSvc.addObserver(authObs, 'http-on-modify-request', false);
  }

  function removeRequestObserver() {
    try { return observerSvc.removeObserver(authObs, 'http-on-modify-request'); }
    catch (err) { console.log('Authorization observer not present'); }
  }

});
