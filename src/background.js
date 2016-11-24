chrome.tabs.onActivated.addListener(function (tab) {
  var url;
  chrome.tabs.get(tab.tabId, function(tab) {
    url = tab.url;
    var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    console.log(domain);
    chrome.storage.sync.get('cypherpunk.privacyFilterWhitelist', function(items) {
      console.log(items);
    });
  });
});
