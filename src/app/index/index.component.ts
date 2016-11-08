import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { HqService } from '../hq.service';
import { ProxySettingsService } from '../proxy-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IndexComponent {
  serverList;
  title = 'Index';
  @Input() domain = '';

  constructor(
    private hqService: HqService,
    private proxySettingsService: ProxySettingsService
  ) {
    // chrome.proxy.settings.get({}, function(config) {
    //     console.log(config.value, config.value.host);
    // });
    chrome.webRequest.onAuthRequired.addListener(
      this.proxyAuth,
      {urls: ["<all_urls>"]},
      ['blocking']
    );
  }
  ngAfterViewChecked() {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let uri = tabs[0].url
      this.domain = uri.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    });
  }

  getServerList(enable: boolean) {
    this.hqService.getServerList()
      .subscribe(
        serverList => {
          this.serverList = serverList;
          console.log(this.serverList);
        },
        error => console.log(<any>error)
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

