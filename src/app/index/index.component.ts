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
  privacyFilter = true;
  privacyFilterWhitelist = this.localStorageService.get('privacyFilterWhitelist') || {};
  smartRouteOpts = {
    auto: 'Auto: USA',
    recommended: 'Silicon Valley, USA (Recommended)',
    closest: 'Japan (Closest)',
    selected: 'Selected Country: Silicon Valley, USA',
    none: 'Do not proxy'
  };
  selectedSmartRouteOpt = this.smartRouteOpts.selected;

  constructor(
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {

    chrome.webRequest.onAuthRequired.addListener(
      this.proxyAuth,
      {urls: ["<all_urls>"]},
      ['blocking']
    );

    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let url = tabs[0].url
      this.domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

      if (this.privacyFilterWhitelist[this.domain] === undefined) {
        this.privacyFilter = true;
      }
      else if (this.privacyFilterWhitelist[this.domain] === false) {
        this.privacyFilter = false;
      }
    });

    this.cypherpunkEnabled = this.localStorageService.get('cypherpunk.enabled');
    this.smartRoutingEnabled = this.proxySettingsService.getProxyStatus();
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

  selectSmartRoute(selection: string) {
    this.selectedSmartRouteOpt = selection;
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

  togglePrivacyFilter(state: boolean) {
    this.privacyFilter = state;
    if (this.privacyFilter) {
       this.privacyFilterWhitelist[this.domain] = undefined;
    }
    else {
      this.privacyFilterWhitelist[this.domain] = false;
    }
    this.localStorageService.set('privacyFilterWhitelist', this.privacyFilterWhitelist);
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

