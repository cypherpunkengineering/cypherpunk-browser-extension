import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { LocalStorageService } from 'angular-2-local-storage';
import { HqService } from './hq.service';
import { SettingsService } from './settings.service';
import { Observable } from 'rxjs/Rx';
//import { PingService } from './ping.service';

@Injectable()
export class ProxySettingsService {
  servers;
  serverArr;
  regions = {
    'NA': 'NORTH AMERICA',
    'SA': 'CENTRAL & SOUTH AMERICA',
    'OP': 'OCEANIA & PACIFIC',
    'EU': 'EUROPE',
    'AS': 'ASIA & INDIA'
  };
  premiumProxyAccount;
  accountType;
  selectedProxy;

  constructor (
    private http: Http,
    private localStorageService: LocalStorageService,
    private settingsService: SettingsService,
    private hqService: HqService
  ) {}

  loadServers() {
    return new Promise((resolve, reject) => {
      this.hqService.login().flatMap(data => { // login
        this.accountType = data.account.type;
        this.premiumProxyAccount = this.accountType === 'premium';
        return this.hqService.fetchUserStatus(); // fetch user credentials
      }).flatMap(data => {
        this.settingsService.saveProxyCredentials(data.privacy.username, data.privacy.password);
        return this.hqService.findServers(this.accountType); // fetch proxy server list
      }).subscribe(servers => {
          this.servers = servers;
          this.serverArr = this.getServerArray();
          let storedSelectedProxy = this.settingsService.selectedProxy();
          if (storedSelectedProxy) {
            this.selectedProxy = storedSelectedProxy;
          }
          // This should ping the closest server to the user and set that as default
          else {
            this.selectedProxy = this.servers.losangeles;
            this.settingsService.saveSelectedProxy(this.selectedProxy);
          }
          // this.pingService.getLatency(this.servers.losangeles.ovHostname).subscribe(value => {
          //   console.log('Los Angeles', value);
          // });
          // this.pingService.getLatency(this.servers.amsterdam.ovHostname).subscribe(value => {
          //   console.log('Amsterdam', value);
          // });

          resolve();
        },
        error => reject(error)
      );
    });
  }

  getServerArray() {
    let regionOrder = { 'NA': 1, 'SA': 2, 'OP': 3, 'EU': 4, 'AS': 5 };

    let serverArr = [];
    let serverKeys = Object.keys(this.servers);
    serverKeys.forEach((key: any) => { serverArr.push(this.servers[key]); });

    // Sort By Region, Country, Name
    serverArr.sort(function(a,b) {
      if (regionOrder[a.region] < regionOrder[b.region]) return -1;
      if (regionOrder[a.region] > regionOrder[b.region]) return 1;
      if (a.country < b.country) return -1;
      if (a.country > b.country) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

    return serverArr;
  }

  getServer(serverId: any) {
    if (!serverId || !this.servers) return {};
    return this.servers[serverId];
  }

  enableProxy() {
    if (!this.servers) return;
    console.log("Applying proxy");
    console.log('> Name:', this.selectedProxy.name);
    console.log('> IP:', this.selectedProxy.httpDefault[0]);
    let proxyIP = this.selectedProxy.httpDefault[0];
    let config = {
      mode: "pac_script",
      pacScript: {
        data: "function FindProxyForURL(url, host) {\n" +
              "  if (shExpMatch(host, \"cypherpunk.com\")) return 'DIRECT';\n" +
              "  if (shExpMatch(host, \"*.com\")) return 'PROXY " + proxyIP + ":3128';\n" +
              "  if (shExpMatch(host, \"*.jp\")) return 'PROXY " + proxyIP + ":3128';\n" +
              "  else return 'PROXY " + proxyIP + ":3128';\n" +
              "}"
      }
    };
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
