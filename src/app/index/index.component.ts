import { Component } from '@angular/core';
import { HqService } from '../hq.service';
import { ProxySettingsService } from '../proxy-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent {
  servers;
  title = 'Index';
  domain = '';

  constructor(
    private hqService: HqService,
    private proxySettingsService: ProxySettingsService
  ) {
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
          this.servers = servers;
          console.log(this.servers);
          this.proxySettingsService.servers = servers;
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

