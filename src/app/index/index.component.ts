import { Component, Input, Output } from '@angular/core';
import { HqService } from '../hq.service';
import { ProxySettingsService } from '../proxy-settings.service';
import { Subject } from 'rxjs/Subject'; 

@Component({
  selector: 'app-root',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent {
  servers: Subject<any>;

  title = 'Index';
  domain = '';

  constructor(
    private hqService: HqService,
    private proxySettingsService: ProxySettingsService
  ) {
    this.servers = new Subject();
    chrome.webRequest.onAuthRequired.addListener(
      this.proxyAuth,
      {urls: ["<all_urls>"]},
      ['blocking']
    );
  }
  ngAfterViewChecked() {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let url = tabs[0].url
      this.domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    });
  }

  loadServers(enable: boolean) {
    this.hqService.findServers()
      .subscribe(
        servers => {
          this.servers.next(servers);
        },
        error => console.log(error)
      );
  }

  enableVpn(enable: boolean) {
    let config;
    if (enable) {
      this.proxySettingsService.enableProxy();
    }
    else {
      this.proxySettingsService.disableProxy();
    }
  }

  proxyAuth(details) {
    return {
      authCredentials: {
        username: "test@test.test",
        password: "test123"
      }
    };
  }
}

