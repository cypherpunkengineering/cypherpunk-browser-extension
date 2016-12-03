import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { LocalStorageService } from 'angular-2-local-storage';
import { HqService } from './hq.service';

@Injectable()
export class ProxySettingsService {
  options: RequestOptions;
  servers;
  premiumProxyAccount;
  accountType;

  constructor (
    private http: Http,
    private localStorageService: LocalStorageService,
    private hqService: HqService
  ) {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    this.options = new RequestOptions({ headers: headers, withCredentials: true });

    this.hqService.login().subscribe(res => {
      let accountType = res.account.type;
      this.accountType = accountType;
      this.premiumProxyAccount = accountType === 'premium';
      console.log('Login Successful for', accountType, 'account');
      this.hqService.findServers(accountType)
        .subscribe(
          servers => {
            // console.log('proxy settings load servers for', accountType, 'account');
            // console.log(servers);
            this.servers = servers;
          },
          error => console.log(error)
        );
    });
  }

  getServerList() {
    return this.servers;
  }

  getServer(serverId: any) {
    if (!serverId || !this.servers) return {};
    return this.servers[serverId];
  }

  isPremiumProxyAccount() {
    return this.premiumProxyAccount;
  }

  enableProxy() {
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

