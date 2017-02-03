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
  privacyFilterSwitch = false;
  regions = this.proxySettingsService.regions;
  premiumAccount = this.proxySettingsService.premiumProxyAccount;

  indexSettings = this.settingsService.indexSettings();
  proxyCredentials = this.indexSettings.proxyCredentials;
  privacyFilterWhitelist = this.indexSettings.privacyFilter.whitelist;
  cypherpunkEnabled = this.indexSettings.cypherpunkEnabled;
  defaultRouting = this.indexSettings.defaultRouting;
  routing = this.indexSettings.routing;
  cachedSmartServers = this.indexSettings.cachedSmartServers;
  selectedRouteOpt = 'Loading...';
  selectedRouteServer;
  selectedRouteServerName = 'Loading...';
  selectedRouteServerFlag = '';
  smartServerName = 'Loading...';
  actualCountryFlag = '';
  actualCountry = '';
  smartServer;
  validProtocol = true;
  countryCode;

  showTutorial = this.indexSettings.showTutorial;

  selectedRouteOpts = {
    smart: 'Smart Routing',
    fastest: 'Fastest',
    selected: 'Selected Server',
    none: 'No Proxy'
  };

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService,
    private hqService: HqService
  ) {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let curTab = tabs[0];
      let url = curTab.url
      this.domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
      let protocol = url.split("://")[0];
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

        // favicon appears to be a normal url
        if (curTab.favIconUrl && curTab.favIconUrl != '' && curTab.favIconUrl.indexOf('chrome://favicon/') == -1) {
          this.faviconUrl = curTab.favIconUrl;
        }
      }
    });

    let init = () => {
      if (this.cypherpunkEnabled) { this.proxySettingsService.enableProxy(); }
      else { this.proxySettingsService.disableProxy(); }

      this.hqService.findNetworkStatus().subscribe(res => {
        this.actualCountry = this.proxySettingsService.countries[res.country];
        this.actualCountryFlag = '/assets/flags/svg/flag-' + res.country + '.svg';
      });
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
      // Not on a valid website
      else {
        this.smartServerName = 'Unavailable';
        this.selectedRouteOpt = 'NONE';
        this.applyNoProxy();
      }
    };

    // Initialize proxy servers
    // If latencyList is populated then background script already populated server info
    if (this.proxySettingsService.latencyList && this.proxySettingsService.latencyList.length) {
      console.log('Servers preloaded by background script');
      this.hqService.fetchUserStatus().subscribe(res => {
        init();
      }, err => {
        this.toggleCypherpunk(false);
      });
    }
    else { // serverArr isn't populated, populate manually in front end
      console.log('Servers being manually loaded');
      this.proxySettingsService.loadServers().then(res => { init(); });
    }
  }

  tutorialVisible(visible: boolean) {
    this.showTutorial = visible;
  }

  changeProxy(server: any) {
    if (server.level === 'premium' && !this.premiumAccount) { return; }
    this.proxySettingsService.enableProxy();
  }

  toggleCypherpunk(enabled: boolean) {
    this.settingsService.saveCypherpunkEnabled(enabled);
    chrome.runtime.sendMessage({ action: "CypherpunkEnabled" });
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

  togglePrivacyFilter(enabled: boolean) {
    this.privacyFilterSwitch = enabled;
    if (this.privacyFilterSwitch) {
       this.privacyFilterWhitelist[this.domain] = undefined;
    }
    else {
      this.privacyFilterWhitelist[this.domain] = false;
    }
    this.settingsService.savePrivacyFilterWhitelist(this.privacyFilterWhitelist);
    chrome.runtime.sendMessage({ action: "PrivacyFilter" });
  }

  toggleRoutingDropdown() {
    this.showRoutingDropdown = !this.showRoutingDropdown;
  }

  selectedRouteType() {
    if (this.selectedRouteOpt === 'Loading...') { return this.selectedRouteOpt; }
    return this.selectedRouteOpts[this.selectedRouteOpt.toLowerCase()];
  }

  selectRouteType(type: string) {
    // Selected type is provided by the selected-server view
    if (type === 'SELECTED') { return; }
    this.selectedRouteServer = undefined;
    this.selectedRouteOpt = type;
    console.log(this.selectedRouteOpt);
    this.routing[this.domain] = { type: type };

    if (type === 'SMART') {
      this.applySmartProxy();
    }
    else if (type === 'FASTEST') {
      this.applyFastestProxy();
    }
    else if (type === 'NONE') {
      this.applyNoProxy();
    }

    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
  }

  applySmartProxy() {
    console.log('Applying Smart Proxy');
    this.selectedRouteServer = this.smartServer;
    this.selectedRouteServerName = this.smartServer.name;
    this.selectedRouteServerFlag = '/assets/flags/svg/flag-' + this.smartServer.country + '.svg';
  }

  applyFastestProxy() {
    console.log('Applying Fastest Proxy');
    this.selectedRouteServer = this.proxySettingsService.fastestServer;
    this.selectedRouteServerName = this.proxySettingsService.fastestServer.name;
    this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + this.selectedRouteServer.country + '.svg';
  }

  applyNoProxy() {
    console.log('Applying No Proxy');
    this.selectedRouteServer = undefined;
    this.selectedRouteServerName = 'Unprotected';
    this.selectedRouteServerFlag = undefined;
  }

  applySelectedProxy(serverId) {
    console.log('Applying Selected Proxy', serverId);
    this.selectedRouteServer = this.proxySettingsService.servers[serverId];
    this.selectedRouteServerName = this.selectedRouteServer.name;
    this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + this.selectedRouteServer.country + '.svg';
    // selectedSmarRouteServer should already be set by the selected-server view
  }

  selectedRoutingInit() {
    console.log(this.indexSettings, this.routing, this.domain, this.routing[this.domain])
    let domainRouteOveride = this.routing[this.domain];
    // If domain has specified routing overrides:
    // Determine if Fastest, Selected Server, or Do not proxy is selected
    if (domainRouteOveride) {
      console.log('Applying Domain Specific Proxy');
      console.log(domainRouteOveride, this.domain);
      this.selectedRouteOpt = domainRouteOveride.type;
      if (domainRouteOveride.type === 'SELECTED') {
        this.applySelectedProxy(domainRouteOveride.serverId);
      }
      else if (domainRouteOveride.type === 'FASTEST') {
        this.applyFastestProxy();
      }
      else if (domainRouteOveride.type === 'NONE') {
        this.applyNoProxy();
      }
      else if (domainRouteOveride.type === 'SMART') {
        this.applySmartProxy();
      }
    }
    // If there is no domain specific routing data stored, use default routing info
    else {
      this.selectedRouteOpt = this.defaultRouting.type.toString();
      console.log('Applying Default Proxy');
      this.selectedRouteServer = this.proxySettingsService.fastestServer;
      let type = this.defaultRouting.type;
      if (type === 'SMART') {
        this.applySmartProxy();
      }
      else if (type === 'SELECTED') {
        this.applySelectedProxy(this.defaultRouting.selected.toString());
      }
      else if (type === 'FASTEST') {
        this.applyFastestProxy();
      }
      else if (type === 'NONE') {
        this.applyNoProxy();
      }
    }
  }
}

