var self = require("sdk/self");

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
// function dummy(text, callback) {
//   callback(text);
// }
// exports.dummy = dummy;

const webExtension = require("sdk/webextension");

webExtension.startup().then(api => {
  const {browser} = api;
  // browser.runtime.onMessage.addListener(handleMessage);
  browser.runtime.onMessage.addListener((msg, sender, sendReply) => {
    if (msg == "message-from-webextension") {
      sendReply({
        content: "reply from legacy add-on"
      });
    }
  });
});
