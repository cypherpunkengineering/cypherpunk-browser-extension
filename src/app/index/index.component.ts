import { Component, Input, Output } from '@angular/core';
import { ProxySettingsService } from '../proxy-settings.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { Subject } from 'rxjs/Subject';
import { HqService } from '../hq.service';
import { SettingsService } from '../settings.service';

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
  faviconUrl = undefined;
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
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService,
    private hqService: HqService
  ) {

    // saves proxy creds to local storage
    this.hqService.fetchUserStatus().subscribe(res => {
      this.settingsService.saveProxyCredentials(res.privacy.username, res.privacy.password);
    });
    console.log(this.settingsService.proxyCredentials());

    chrome.webRequest.onAuthRequired.addListener(
      this.proxyAuth,
      {urls: ["<all_urls>"]},
      ['blocking']
    );

    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let curTab = tabs[0];
      let url = curTab.url
      this.domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

      if (this.privacyFilterWhitelist[this.domain] === undefined) {
        this.privacyFilter = true;
      }
      else if (this.privacyFilterWhitelist[this.domain] === false) {
        this.privacyFilter = false;
      }

      let favurl = url ? url.replace(/#.*$/, '') : ''; // drop #hash

      // favicon appears to be a normal url
      if (curTab.favIconUrl && curTab.favIconUrl != '' && curTab.favIconUrl.indexOf('chrome://favicon/') == -1) {
        this.faviconUrl = curTab.favIconUrl;
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
    console.log('Toggling privacy for', this.domain, state);
    this.privacyFilter = state;
    if (this.privacyFilter) {
       this.privacyFilterWhitelist[this.domain] = undefined;
    }
    else {
      this.privacyFilterWhitelist[this.domain] = false;
    }
    this.localStorageService.set('privacyFilterWhitelist', this.privacyFilterWhitelist);
    console.log(this.privacyFilterWhitelist);
  }

  proxyAuth(details) {
    var credentials = this.settingsService.proxyCredentials();
    return {
      authCredentials: {
        username: credentials.username,
        password: credentials.password
      }
    };
  }
}

