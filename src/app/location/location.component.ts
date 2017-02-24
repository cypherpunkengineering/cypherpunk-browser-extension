import { SettingsService } from '../settings.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { ProxySettingsService } from '../proxy-settings.service';
import { Component, NgZone, style, animate, transition, state, trigger } from '@angular/core';

@Component({
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  host: { '[@routeAnimation]': 'true' },
  animations: [
    trigger('routeAnimation', [
      state('*', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(100%)' }),
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)')
      ]),
      transition('* => void',
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)', style({
          transform: 'translateX(100%)'
        }))
      )
    ])
   ]
})
export class LocationComponent {
  routing: any;
  defaultRouting: any;
  accountType: string;

  siteName: string;
  siteUrl: string;
  favIconUrl: string;

  privacyFilterWhitelist = {};
  blockAds = true;
  blockMalware = true;

  proxyMode: string;
  showServers = false;
  regions = {};
  serverArr = [];
  selectedServerId: string;

  constructor(
    private zone: NgZone,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {
    // load default settings
    this.regions = this.proxySettingsService.regions;
    this.serverArr = this.proxySettingsService.serverArr;
    this.routing = this.settingsService.selectedServerSettings().routing;
    this.defaultRouting = this.settingsService.defaultRoutingSettings();
    this.accountType = this.settingsService.proxySettingsService().accountType;

    // load site information
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      // Load site name and url
      this.siteName = tabs[0].title;
      this.siteUrl = tabs[0].url;
      let match = this.siteUrl.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/);
      this.siteUrl = match ? match[1] : null;

      // Load site fav icon
      if (tabs[0].favIconUrl && tabs[0].favIconUrl !== '' && tabs[0].favIconUrl.indexOf('chrome://favicon/') === -1) {
        this.favIconUrl = tabs[0].favIconUrl;
      }

      // load proxy settings from localStorage if exists
      let localRouting = this.routing[this.siteUrl];
      if (localRouting) {
        this.proxyMode = localRouting.type;
        this.selectedServerId = localRouting.serverId;
        if (this.proxyMode === 'SELECTED') { this.showServers = true; }
      }

      // load privacy settings from localStorage if exists
      let privacySettings = this.settingsService.privacyFilterSettings();
      this.privacyFilterWhitelist = privacySettings.whitelist;

      let localPrivacySettings = this.privacyFilterWhitelist[this.siteUrl];
      if (localPrivacySettings) {
        this.blockAds = localPrivacySettings.blockAds;
        this.blockMalware = localPrivacySettings.blockMalware;
      }
      else {
        this.blockAds = privacySettings.blockAds;
        this.blockMalware = privacySettings.blockMalware;
      }
    });
  }

  toggleBlockAds(enabled: boolean) {
    let currentEntry = this.privacyFilterWhitelist[this.siteUrl];
    if (currentEntry) { currentEntry.blockAds = enabled; }
    else { currentEntry = { blockAds: enabled, blockMalware: this.blockMalware }; }
    this.privacyFilterWhitelist[this.siteUrl] = currentEntry;
    this.settingsService.savePrivacyFilterWhitelist(this.privacyFilterWhitelist);
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });
  }

  toggleBlockMalware(enabled: boolean) {
    let currentEntry = this.privacyFilterWhitelist[this.siteUrl];
    if (currentEntry) { currentEntry.blockMalware = enabled; }
    else { currentEntry = { blockAds: this.blockAds, blockMalware: enabled }; }
    this.privacyFilterWhitelist[this.siteUrl] = currentEntry;
    this.settingsService.savePrivacyFilterWhitelist(this.privacyFilterWhitelist);
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });
  }

  useCypherplay() {
    this.proxyMode = 'SMART';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'SMART', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
  }

  useFastest() {
    this.proxyMode = 'FASTEST';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'FASTEST', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
  }

  useFastestUK() {
    this.proxyMode = 'FASTESTUK';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'FASTESTUK', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
  }

  useFastestUS() {
    this.proxyMode = 'FASTESTUS';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'FASTESTUS', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
  }

  useNoProxy() {
    this.proxyMode = 'NONE';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'NONE', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
  }

  useServer() { this.showServers = !this.showServers; }

  selectProxy(server) {
    this.proxyMode = 'SELECTED';
    let valid: any = true;
    if (server.level === 'premium' && this.accountType === 'free') { valid = 'premium'; }
    else if (!server.enabled) { valid = 'enabled'; }
    else if (!server.httpDefault.length) { valid = 'http'; }

    if (valid === true) {
      this.selectedServerId = server.id;
      this.routing[this.siteUrl] = { type: 'SELECTED', serverId: server.id };
      this.settingsService.saveRouting(this.routing);
      this.proxySettingsService.enableProxy();
    }
  }
}
