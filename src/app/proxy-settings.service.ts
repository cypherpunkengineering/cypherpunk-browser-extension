import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { LocalStorageService } from 'angular-2-local-storage';
import { HqService } from './hq.service';

@Injectable()
export class ProxySettingsService {
  options: RequestOptions;
  servers;

  constructor (
    private http: Http,
    private localStorageService: LocalStorageService,
    private hqService: HqService
  ) {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    this.options = new RequestOptions({ headers: headers, withCredentials: true });

    this.hqService.login().subscribe(res => {
      console.log(res);
      this.hqService.findServers()
        .subscribe(
          servers => {
            console.log('proxy settings load servers');
            console.log(servers);
            this.servers = servers;
          },
          error => console.log(error)
        );
    });
  }

  enableProxy() {
    console.log("applying proxy:");
    let config = {
      mode: "pac_script",
      pacScript: {
        data: "function FindProxyForURL(url, host) {\n" +
          // proxy for new york -> NA -> US -> Index: 1
              "  return 'PROXY 204.145.66.40:3128';\n" +
              "}"
      }
    };
    console.log(config);
    chrome.proxy.settings.set({value: config, scope: 'regular'}, () => {
      this.localStorageService.set('proxy.enabled', true);
    });
  }

  disableProxy() {
    console.log("remove proxy config");
    let config = {
      mode: "system"
    }
    chrome.proxy.settings.set({value: config, scope: 'regular'}, () => {
      this.localStorageService.set('proxy.enabled', false);
    });
  }
}

