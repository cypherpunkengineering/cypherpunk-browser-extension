import './polyfills.ts';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppModule } from './app/index';

localStorage.setItem('cypherpunk.firefox', 'true');

console.log("DEBUG");
chrome.runtime.sendMessage("message-from-webextension", reply => {
  if (reply) {
    console.log('Using FireFox Browser:', localStorage.getItem('cypherpunk.firefox'));
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
