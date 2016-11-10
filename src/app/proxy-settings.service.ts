import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

@Injectable()
export class ProxySettingsService {
  constructor (private http: Http) {}

  enableProxy() {
    console.log("applying proxy:");
    let config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: "204.145.66.40",
          port: 3128
        },
        bypassList: ["cypherpunk.engineering"]
      }
    };
    console.log(config);
    chrome.proxy.settings.set(
      {value: config, scope: 'regular'},
      function() {});
  }

  disableProxy() {
    console.log("remove proxy config");
    let config = {
      mode: "system"
    }
    chrome.proxy.settings.set(
      {value: config, scope: 'regular'},
      function() {});
  }
}

