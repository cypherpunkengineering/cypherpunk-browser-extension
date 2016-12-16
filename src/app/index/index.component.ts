import { Component, Input, Output, style, animate, transition, state, trigger } from '@angular/core';
import { ProxySettingsService } from '../proxy-settings.service';
import { Subject } from 'rxjs/Subject';
import { HqService } from '../hq.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  host: { '[@routeAnimation]': 'true' },
  animations: [
    trigger('routeAnimation', [
      state('*',  style({transform: 'translateX(0)'})),
      transition('* => void',
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)', style({transform: 'translateX(0)'}))
      )
    ])
  ]
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
  selectedSmartRouteServerName = 'Loading...';
  selectedProxy = this.indexSettings.selectedProxy;

  smartRouteOpts = {
    recommended: { title: 'Silicon Valley, USA (Recommended)', type: 'Recommended' },
    closest: { title: 'Loading...', type: 'Closest' },
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

      if (this.cypherpunkEnabled) { this.proxySettingsService.enableProxy(); }
      else { this.proxySettingsService.disableProxy(); }

      this.smartRoutingInit();

      this.hqService.findNetworkStatus().subscribe(res => {
        console.log('Network status', res);
      });
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
    chrome.runtime.sendMessage({ greeting: "CypherpunkEnabled" });
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
  }

  toggleSmartRouting(enabled: boolean) {
    this.settingsService.saveSmartRoutingEnabled(enabled);
    this.smartRoutingEnabled = enabled;
    if (enabled) {
      console.log('Smart Routing Disabled');
      this.smartRoutingInit();
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
    // Selected type is provided by the selected-server view
    if (type === 'SELECTED') { return; }
    this.selectedSmartRouteServer = undefined;
    this.selectedSmartRouteOpt = type;
    // Don't store smart routing info if on recommended
    if (this.smartRouting[this.domain] && type === 'RECOMMENDED') {
      delete this.smartRouting[this.domain];
    }
    else {
      this.smartRouting[this.domain] = { type: type };

      if (type === 'Recommended') {
        this.applyRecommendedProxy();
      }
      else if (type === 'CLOSEST') {
        this.applyClosestProxy();
      }
      else if (type === 'NONE') {
        this.applyNoProxy();
      }
    }

    this.settingsService.saveSmartRouting(this.smartRouting);
  }

  // TODO: This only applies when selection is made in the extension. We need
  // to apply the proxy upon tab activation in the background script to switch proxy per site.
  applyRecommendedProxy() {
    console.log('Applying Recommended Proxy');
    // 1) If .com pick first proxy server in US
    // 2) If .jp pick first proxy server in Japan
  }

  applyClosestProxy() {
    console.log('Applying Closest Proxy');
    this.selectedSmartRouteServer = this.proxySettingsService.closestServer;
    this.selectedSmartRouteServerName = this.proxySettingsService.closestServer.name;
    this.proxySettingsService.selectedProxy = this.selectedSmartRouteServer;
    this.proxySettingsService.disableProxy();
    this.proxySettingsService.enableProxy();
  }

  applyNoProxy() {
    console.log('Applying No Proxy');
    this.selectedSmartRouteServer = undefined;
    this.selectedSmartRouteServerName = 'Unprotected';
    this.proxySettingsService.disableProxy();
  }

  applySelectedProxy(curSmartRoute) {
    console.log('Applying Selected Proxy');
    this.selectedSmartRouteServer = this.servers[curSmartRoute.serverId];
    this.selectedSmartRouteServerName = this.selectedSmartRouteServer.name;
    // selectedSmarRouteServer should already be set by the selected-server view
    this.proxySettingsService.disableProxy();
    this.proxySettingsService.enableProxy();
  }

  smartRoutingInit() {
    if (this.smartRoutingEnabled) {
      let curSmartRoute = this.smartRouting[this.domain];
      // Smart routing is on, either Closest, Selected Server, or Do not proxy is selected
      if (curSmartRoute) {
        this.selectedSmartRouteOpt = curSmartRoute.type;
        if (curSmartRoute.type === 'SELECTED') {
          this.applySelectedProxy(curSmartRoute);
        }
        else if (curSmartRoute.type === 'CLOSEST') {
           this.applyClosestProxy();
        }
        else if (curSmartRoute.type === 'NONE') {
          this.applyNoProxy();
        }
      }
      // If there is no smart routing data stored, default to recommended
      else {
        this.selectedSmartRouteOpt = 'RECOMMENDED';
      }
    }
  }

}

