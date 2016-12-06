import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { LocalStorageService } from 'angular-2-local-storage';
import { HqService } from './hq.service';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class ProxySettingsService {
  options: RequestOptions;
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
    private hqService: HqService
  ) {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    this.options = new RequestOptions({ headers: headers, withCredentials: true });
  }

  loadServers() {
    return new Promise((resolve, reject) => {
      this.hqService.login().flatMap(data => {
        this.accountType = data.account.type;
        this.premiumProxyAccount = this.accountType === 'premium';
        return this.hqService.findServers(this.accountType);
      }).subscribe(servers => {
          this.servers = servers;
          this.serverArr = this.getServerArray();
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
    console.log("applying proxy:");
    let proxyIP = this.servers.losangeles.httpDefault[0];
    console.log(proxyIP);
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

  getLocalIPs(callback) {
    var ips = [];
    // var RTCPeerConnection = window.RTCPeerConnection ||
    //     window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.onicecandidate = function(e) {
      if (!e.candidate) {
        pc.close();
        callback(ips);
        return;
      }
      var ip = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];
      if (ips.indexOf(ip) == -1) ips.push(ip);
    };
    pc.createOffer(function(sdp) {
        pc.setLocalDescription(sdp);
    }, function onerror() {});
  }
}

