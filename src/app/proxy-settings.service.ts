import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

@Injectable()
export class ProxySettingsService {
  private _servers;
  get servers() {
    return this._servers;
  }
  set servers(s) {
    this._servers = s;
  }
  
  options: RequestOptions;
  constructor (private http: Http) {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    this.options = new RequestOptions({ headers: headers, withCredentials: true });
  }

  enableProxy() {
    console.log("applying proxy:");
    let config = {
      mode: "pac_script",
      pacScript: {
        data: "function FindProxyForURL(url, host) {\n" +
              "  return 'PROXY 204.145.66.40:3128';\n" +
              "}"
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

