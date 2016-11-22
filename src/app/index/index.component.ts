import { Component, Input, Output } from '@angular/core';
import { ProxySettingsService } from '../proxy-settings.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-root',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent {
  title = 'Index';
  domain = '(Loading...)';
  cypherpunkEnabled = undefined;
  smartRoutingEnabled = undefined;
  showRoutingDropdown = false;

  constructor(
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {
    chrome.webRequest.onAuthRequired.addListener(
      this.proxyAuth,
      {urls: ["<all_urls>"]},
      ['blocking']
    );
    this.cypherpunkEnabled = this.localStorageService.get('cypherpunk.enabled');
    this.smartRoutingEnabled = this.proxySettingsService.getProxyStatus();
  }

  ngAfterViewChecked() {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let url = tabs[0].url
      this.domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    });
  }

  toggleRoutingDropdown() {
    this.showRoutingDropdown = !this.showRoutingDropdown;
  }

  toggleCypherpunk(state: boolean) {
    this.localStorageService.set('cypherpunk.enabled', state);
    this.cypherpunkEnabled = state;
    if (!this.cypherpunkEnabled) {
      this.smartRoutingEnabled = false;
      this.showRoutingDropdown = false;
      this.proxySettingsService.disableProxy();
    }
  }

  enableProxy(enable: boolean) {
    let config;
    if (enable) {
      this.proxySettingsService.enableProxy();
    }
    else {
      this.proxySettingsService.disableProxy();
      this.showRoutingDropdown = false;
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

