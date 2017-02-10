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
  // Misc Vars
  title = 'Index';
  validProtocol = true;
  faviconUrl = undefined;
  regions = this.proxySettingsService.regions;
  premiumAccount = this.proxySettingsService.premiumProxyAccount;

  // Settings Vars
  indexSettings = this.settingsService.indexSettings();
  proxyCredentials = this.indexSettings.proxyCredentials;
  privacyFilterWhitelist = this.indexSettings.privacyFilter.whitelist;
  cypherpunkEnabled = this.indexSettings.cypherpunkEnabled;
  defaultRouting = this.indexSettings.defaultRouting;
  routing = this.indexSettings.routing;
  cachedSmartServers = this.indexSettings.cachedSmartServers;
  showTutorial = this.indexSettings.showTutorial;

  // Proxy Connection Display Vars
  selectedRouteOpt = 'Loading...';
  selectedRouteServerName = 'Loading...';
  selectedRouteServerFlag = '';
  selectedRouteServer;
  actualCountryFlag = '';
  actualCountry = '';
  domain = 'Loading...';

  // Smart Server Vars
  countryCode;
  smartServer;
  smartServerName = 'Loading...';

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService,
    private hqService: HqService
  ) {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let curTab = tabs[0];
      let url = curTab.url
      let match = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/);
      this.domain = match ? match[1] : null;
      let protocol = url ? url.split("://")[0] : null;
      this.validProtocol = protocol === 'http' || protocol === 'https';
      if (this.domain && this.validProtocol) {
        // Get Smart Route name
        let match = this.domain.match(/[.](au|br|ca|ch|de|fr|uk|hk|in|it|jp|nl|no|ru|se|sg|tr|com)/);
        let tld = match && match.length ? match[0] : null;
        if (tld) {
          tld = tld.slice(1); // remove "."
          this.countryCode = tld;
        }
        else { this.countryCode = "COM"; } // Default to COM (US)

        // .com -> US and .uk -> GB, all other tlds are direct translations
        // Try to preload smart server name from cache
        if (this.cachedSmartServers) {
          this.smartServer = this.cachedSmartServers[this.countryCode.toLowerCase()];
          this.smartServerName = this.smartServer.name;
        }

        // Load fav icon
        let favurl = url ? url.replace(/#.*$/, '') : ''; // drop #hash
        if (curTab.favIconUrl && curTab.favIconUrl != '' && curTab.favIconUrl.indexOf('chrome://favicon/') == -1) {
          this.faviconUrl = curTab.favIconUrl;
        }
      }
    });

    // Initialize proxy servers. If latencyList is populated then background
    // script already populated server info
    if (this.proxySettingsService.latencyList && this.proxySettingsService.latencyList.length) {
      console.log('Servers data preloaded by background script');
      this.hqService.fetchUserStatus()
      .subscribe(res => {
        this.init();
      }, err => {
        this.toggleCypherpunk(false);
      });
    }
    else { // latencyList isn't populated, populate manually in front end
      console.log('Server data being manually loaded');
      this.proxySettingsService.loadServers()
      .then(res => { this.init(); })
      .catch(err => {
        this.toggleCypherpunk(false);
      });
    }
  }

  init() {
    // Check if Cypherpunk is on and enable/disable proxy
    if (this.cypherpunkEnabled) { this.proxySettingsService.enableProxy(); }
    else { this.proxySettingsService.disableProxy(); }

    // Get user's actual location
    this.hqService.findNetworkStatus().subscribe(res => {
      this.actualCountry = this.proxySettingsService.countries[res.country];
      this.actualCountryFlag = '/assets/flags/svg/flag-' + res.country + '.svg';
    });

    // If the user is on a tab with a valid domain/protocol. Select the user's stored
    // routing settings in the UI, for display purposes.
    if (this.domain && this.validProtocol) {
      // Check if the cache updated then update the smart server name if so
      if (Object.keys(this.proxySettingsService.cachedSmartServers).length) {
        this.smartServer = this.proxySettingsService.cachedSmartServers[this.countryCode.toLowerCase()];
        this.smartServerName = this.smartServer.name;
      }
      else { // Cache isn't present fetch smart route manually
        this.smartServer = this.proxySettingsService.getSmartServer(this.countryCode);
        this.smartServerName = this.smartServer.name;
      }

      // Load which proxy is selected once we have domain info
      this.selectedRoutingInit();
    }
    else { // Not on a valid website, apply no proxy
      this.smartServerName = 'Unavailable';
      this.selectedRouteOpt = 'NONE';
      this.applyNoProxy();
    }
  };

  tutorialVisible(visible: boolean) { this.showTutorial = visible; }

  toggleCypherpunk(enabled: boolean) {
    this.cypherpunkEnabled = enabled;
    this.settingsService.saveCypherpunkEnabled(enabled);
    chrome.runtime.sendMessage({ action: "CypherpunkEnabled" });

    if (enabled) { this.proxySettingsService.enableProxy(); }
    else { this.proxySettingsService.disableProxy(); }
  }

  selectedRouteType() {
    if (this.selectedRouteOpt === 'Loading...') { return this.selectedRouteOpt; }
    let selectedRouteOpts = {
      smart: 'Smart Routing',
      fastest: 'Fastest',
      selected: 'Selected Server',
      none: 'No Proxy'
    };
    return selectedRouteOpts[this.selectedRouteOpt.toLowerCase()];
  }

  /* Selects routing type, when user selects a type via the UI */
  selectRouteType(type: string) {
    // 'SELECTED' type is set by the selected-server view
    if (type === 'SELECTED') { return; }
    this.selectedRouteServer = undefined;
    this.selectedRouteOpt = type;
    this.routing[this.domain] = { type: type };

    switch (type) {
      case 'SMART':
        this.applySmartProxy();
        break;
      case 'FASTEST':
        this.applyFastestProxy();
        break;
      case 'NONE':
      default:
        this.applyNoProxy();
    }

    console.log('Applying Selected Routing Type');
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
  }

  /* Looks at stored settings and preselects correct routing type in the UI */
  selectedRoutingInit() {
    // Check if override for domain exists, apply override settings if it does
    let override = this.routing[this.domain];
    let type : string = override ? override.type : this.defaultRouting.type;
    let selectedServerId : string = override ? override.serverId : this.defaultRouting.selected;
    this.selectedRouteOpt = type;

    switch (type) {
      case 'SMART':
        this.applySmartProxy();
        break;
      case 'SELECTED':
        selectedServerId = override ? override.serverId : this.defaultRouting.selected.toString();
        this.applySelectedProxy(selectedServerId);
        break;
      case 'FASTEST':
        this.applyFastestProxy();
        break;
      case 'NONE':
      default:
        this.applyNoProxy();
    }
  }

  applySmartProxy() {
    console.log('Smart Proxy');
    this.selectedRouteServer = this.smartServer;
    this.selectedRouteServerName = this.smartServer.name;
    this.selectedRouteServerFlag = '/assets/flags/svg/flag-' + this.smartServer.country + '.svg';
  }

  applySelectedProxy(serverId) {
    console.log('Selected Proxy', serverId);
    this.selectedRouteServer = this.proxySettingsService.servers[serverId];
    this.selectedRouteServerName = this.selectedRouteServer.name;
    this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + this.selectedRouteServer.country + '.svg';
  }

  applyFastestProxy() {
    console.log('Fastest Proxy');
    this.selectedRouteServer = this.proxySettingsService.fastestServer;
    this.selectedRouteServerName = this.proxySettingsService.fastestServer.name;
    this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + this.selectedRouteServer.country + '.svg';
  }

  applyNoProxy() {
    console.log('No Proxy');
    this.selectedRouteServer = undefined;
    this.selectedRouteServerName = 'Unprotected';
    this.selectedRouteServerFlag = undefined;
  }

}

