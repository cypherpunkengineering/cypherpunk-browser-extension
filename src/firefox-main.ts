import './polyfills.ts';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppModule } from './app/index';

console.log("DEBUG");
console.log(browser);
browser.runtime.sendMessage("message-from-webextension").then(reply => {
  if (reply) {
    console.log("response from legacy add-on: " + reply.content);
  }
});
// ffrequire = eval('require'); 
// let prefs = require('sdk/preferences/service');
// console.log(prefs);

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
