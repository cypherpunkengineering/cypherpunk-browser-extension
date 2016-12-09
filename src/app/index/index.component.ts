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
  servers;
  serverArr;
  regions = this.proxySettingsService.regions;


  indexSettings = this.settingsService.indexSettings();
  proxyCredentials = this.indexSettings.proxyCredentials;
  privacyFilterWhitelist = this.indexSettings.privacyFilter.whitelist;
  cypherpunkEnabled = this.indexSettings.cypherpunkEnabled;
  smartRoutingEnabled = this.indexSettings.smartRoutingEnabled;
  smartRouting = this.indexSettings.smartRouting;
  selectedSmartRouteOpt = 'Loading...';
  selectedSmartRouteServer;
  selectedProxy = this.indexSettings.selectedProxy;

  smartRouteOpts = {
    recommended: { title: 'Silicon Valley, USA (Recommended)', type: 'Recommended' },
    closest: { title: 'Japan (Closest)', type: 'Closest' },
    selected: { title: 'Selected Server: Silicon Valley, USA', type: 'Selected Server' },
    none: { title: 'Do not proxy', type: 'No Proxy' }
  };

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService,
    private hqService: HqService
  ) {

    // Initialize proxy servers
    this.proxySettingsService.loadServers().then(res => {
      this.servers = this.proxySettingsService.servers;
      this.serverArr = this.proxySettingsService.serverArr;

      if (this.cypherpunkEnabled) { this.proxySettingsService.enableProxy(); }
      else { this.proxySettingsService.disableProxy(); }

      let curSmartRoute = this.smartRouting[this.domain];
      if (curSmartRoute) {
        this.selectedSmartRouteOpt = curSmartRoute.type;
        if (curSmartRoute.serverId) {
          this.selectedSmartRouteServer = this.servers[curSmartRoute.serverId].name;
        }
      }
      else { this.selectedSmartRouteOpt = 'RECOMMENDED'; }
    });

    // Grab domain name, favicon and privacy filter settings
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

  changeProxy(server: Object) {
    this.selectedProxy = server;
    this.settingsService.saveSelectedProxy(server);
    this.proxySettingsService.selectedProxy = server;
    this.proxySettingsService.disableProxy();
    this.proxySettingsService.enableProxy();
  }

  toggleCypherpunk(enabled: boolean) {
    this.settingsService.saveCypherpunkEnabled(enabled);
    // Triggers boolean change when large switch is hit
    if (this.cypherpunkEnabled !== enabled) {
      this.cypherpunkEnabled = enabled;
    }
    if (enabled) {
      this.proxySettingsService.enableProxy();
    }
    else {
      this.showRoutingDropdown = false;
      this.proxySettingsService.disableProxy();
    }
    chrome.runtime.sendMessage({ greeting: "CypherpunkEnabled" });
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
    chrome.runtime.sendMessage({ greeting: "PrivacyFilter" });
  }

  toggleRoutingDropdown() {
    this.showRoutingDropdown = !this.showRoutingDropdown;
  }

  smartRouteType() {
    if (this.selectedSmartRouteOpt === 'Loading...') { return this.selectedSmartRouteOpt; }
    return this.smartRouteOpts[this.selectedSmartRouteOpt.toLowerCase()].type;
  }

  selectSmartRoute(type: string) {
    if (type === 'SELECTED') { return; }
    this.selectedSmartRouteServer = undefined;
    this.selectedSmartRouteOpt = type;
    // Don't store smart routing info if on recommended
    if (this.smartRouting[this.domain] && type === 'RECOMMENDED') {
      delete this.smartRouting[this.domain];
    }
    else {
      this.smartRouting[this.domain] = { type: type }
    }

    this.settingsService.saveSmartRouting(this.smartRouting);
  }

}

