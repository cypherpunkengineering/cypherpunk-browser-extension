import { Component, Input, Output } from '@angular/core';
import { ProxySettingsService } from '../proxy-settings.service';
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
  showRoutingDropdown = false;
  faviconUrl = undefined;
  privacyFilterSwitch = true;

  indexSettings = this.settingsService.indexSettings();
  proxyCredentials = this.indexSettings.proxyCredentials;
  privacyFilterWhitelist = this.indexSettings.privacyFilter.whitelist;
  cypherpunkEnabled = this.indexSettings.cypherpunkEnabled;
  smartRoutingEnabled = this.indexSettings.smartRoutingEnabled;

  smartRouteOpts = {
    auto: 'Auto: USA',
    recommended: 'Silicon Valley, USA (Recommended)',
    closest: 'Japan (Closest)',
    selected: 'Selected Country: Silicon Valley, USA',
    none: 'Do not proxy'
  };
  selectedSmartRouteOpt = this.smartRouteOpts.selected;

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService,
    private hqService: HqService
  ) {

    // saves proxy creds to local storage
    this.hqService.fetchUserStatus().subscribe(res => {
      this.settingsService.saveProxyCredentials(res.privacy.username, res.privacy.password);
    });

    chrome.webRequest.onAuthRequired.addListener(
      () => {
        return {
          authCredentials: {
            username: this.proxyCredentials.username,
            password:  this.proxyCredentials.password
          }
        };
      },
      {urls: ["<all_urls>"]},
      ['blocking']
    );

    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let curTab = tabs[0];
      let url = curTab.url
      this.domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

      if (this.privacyFilterWhitelist[this.domain] === undefined) {
        this.privacyFilterSwitch = true;
      }
      else if (this.privacyFilterWhitelist[this.domain] === false) {
        this.privacyFilterSwitch = false;
      }

      let favurl = url ? url.replace(/#.*$/, '') : ''; // drop #hash

      // favicon appears to be a normal url
      if (curTab.favIconUrl && curTab.favIconUrl != '' && curTab.favIconUrl.indexOf('chrome://favicon/') == -1) {
        this.faviconUrl = curTab.favIconUrl;
      }
    });
  }

  toggleCypherpunk(enabled: boolean) {
    this.settingsService.saveCypherpunkEnabled(enabled);
    if (enabled) {
      this.proxySettingsService.enableProxy();
    }
    else {
      this.showRoutingDropdown = false;
      this.proxySettingsService.disableProxy();
    }
  }

  toggleSmartRouting(enabled: boolean) {
    this.settingsService.saveSmartRoutingEnabled(enabled);
    this.smartRoutingEnabled = enabled;
    if (enabled) {
      console.log('Smart Routing Enabled');
    }
    else {
      console.log('Smart Routing Disabled');
    }
  }

  togglePrivacyFilter(enabled: boolean) {
    this.privacyFilterSwitch = enabled;
    if (this.privacyFilterSwitch) {
       this.privacyFilterWhitelist[this.domain] = undefined;
    }
    else {
      this.privacyFilterWhitelist[this.domain] = false;
    }
    this.settingsService.savePrivacyFilterWhitelist(this.privacyFilterWhitelist);
  }

  toggleRoutingDropdown() {
    this.showRoutingDropdown = !this.showRoutingDropdown;
  }

  selectSmartRoute(selection: string) {
    this.selectedSmartRouteOpt = selection;
  }

}

