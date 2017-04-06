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

  blockAds = true;
  blockMalware = true;
  privacyFilterWhitelist = {};

  regions = {};
  serverMap = {};
  searchText = '';
  proxyMode: string;
  serverSortOrder = 'geo';
  selectedServerId: string;
  showServers = false;
  hasOverrides: boolean;

  geoServers = [];
  alphaServers = [];
  latencyServers = [];
  currentServers = [];
  starredServers = [];

  constructor(
    private zone: NgZone,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {
    // load default settings
    this.regions = this.proxySettingsService.regions;
    this.serverMap = this.proxySettingsService.servers;
    this.accountType = this.settingsService.proxySettingsService().accountType;

    this.routing = this.settingsService.selectedServerSettings().routing;
    this.defaultRouting = this.settingsService.defaultRoutingSettings();
    this.geoServers = this.appendLatency(this.proxySettingsService.serverArr);
    this.latencyServers = this.latencySort(this.settingsService.latencyList);
    this.alphaServers = this.alphaSort(this.geoServers);
    this.currentServers = this.geoServers;
    this.starredServers = settingsService.starredServers;


    // load site information
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      // Load site name and url
      this.siteName = tabs[0].title;
      this.siteUrl = tabs[0].url;
      let match = this.siteUrl.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/);
      this.siteUrl = match ? match[1] : null;

      let protocol = this.siteUrl ? this.siteUrl.split('://')[0] : null;
      let validProtocol = protocol === 'http' || protocol === 'https';

      // Load site fav icon
      if (tabs[0].favIconUrl && tabs[0].favIconUrl !== '' && tabs[0].favIconUrl.indexOf('chrome://favicon/') === -1 && validProtocol) {
        this.favIconUrl = tabs[0].favIconUrl;
      }

      // load proxy settings from localStorage if exists
      let localRouting = this.routing[this.siteUrl];
      if (localRouting && validProtocol) {
        this.proxyMode = localRouting.type;
        this.selectedServerId = localRouting.serverId;
        if (this.proxyMode === 'SELECTED') { this.showServers = true; }
        this.hasOverrides = true;
      }

      // load privacy settings from localStorage if exists
      let privacySettings = this.settingsService.privacyFilterSettings();
      this.privacyFilterWhitelist = privacySettings.whitelist;

      let localPrivacySettings = this.privacyFilterWhitelist[this.siteUrl];
      if (localPrivacySettings && validProtocol) {
        this.blockAds = localPrivacySettings.blockAds;
        this.blockMalware = localPrivacySettings.blockMalware;
        this.hasOverrides = true;
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
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  toggleBlockMalware(enabled: boolean) {
    let currentEntry = this.privacyFilterWhitelist[this.siteUrl];
    if (currentEntry) { currentEntry.blockMalware = enabled; }
    else { currentEntry = { blockAds: this.blockAds, blockMalware: enabled }; }
    this.privacyFilterWhitelist[this.siteUrl] = currentEntry;
    this.settingsService.savePrivacyFilterWhitelist(this.privacyFilterWhitelist);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useCypherplay() {
    this.proxyMode = 'SMART';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'SMART', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useFastest() {
    this.proxyMode = 'FASTEST';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'FASTEST', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useFastestUK() {
    this.proxyMode = 'FASTESTUK';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'FASTESTUK', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useFastestUS() {
    this.proxyMode = 'FASTESTUS';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'FASTESTUS', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useNoProxy() {
    this.proxyMode = 'NONE';
    this.selectedServerId = '';
    this.showServers = false;
    this.routing[this.siteUrl] = { type: 'NONE', serverId: '' };
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useServer() { this.showServers = !this.showServers; }

  isStarred(server) {
    let starred = false;
    this.starredServers.map((starredServer) => {
      if (server.id === starredServer.id) { starred = true; }
    });
    return starred;
  }

  starServer(server) { this.settingsService.starServer(server); }

  unstarServer(server) { this.settingsService.unstarServer(server); }

  disabledServer(server) {
    if (server.level === 'premium' && this.accountType === 'free') { return true; }
    else if (!server.enabled) { return true; }
    else if (!server.httpDefault.length) { return true; }
    else { return false; }
  }

  selectProxy(server) {
    this.proxyMode = 'SELECTED';
    let valid: any = true;
    if (server.level === 'premium' && this.accountType === 'free') { valid = false; }
    else if (!server.enabled) { valid = false; }
    else if (!server.httpDefault.length) { valid = false; }

    if (valid === true) {
      this.selectedServerId = server.id;
      this.routing[this.siteUrl] = { type: 'SELECTED', serverId: server.id };
      this.settingsService.saveRouting(this.routing);
      this.proxySettingsService.enableProxy();
      this.settingsService.updateServerUsage(server.id);
      this.hasOverrides = true;
    }
  }

  resetSiteOverrides() {
    if (!this.hasOverrides) { return; }
    this.proxyMode = '';
    this.selectedServerId = '';
    this.hasOverrides = false;
    let privacySettings = this.settingsService.privacyFilterSettings();
    this.blockAds = privacySettings.blockAds;
    this.blockMalware = privacySettings.blockMalware;

    // reset privacy whitelist
    delete this.privacyFilterWhitelist[this.siteUrl];
    this.settingsService.savePrivacyFilterWhitelist(this.privacyFilterWhitelist);
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });

    // reset proxy settings
    delete this.routing[this.siteUrl];
    this.settingsService.saveRouting(this.routing);
    this.proxySettingsService.enableProxy();
  }

  appendLatency(latencyServers) {
    let appendedServers = [];
    latencyServers.forEach((server) => {
      let thisServer = this.serverMap[server.id];
      thisServer.latency = server.latency;
      appendedServers.push(thisServer);
    });
    return appendedServers;
  }

  latencySort(servers) {
    let sortedServers = [];
    servers.forEach((server) => {
      let thisServer = this.serverMap[server.id];
      thisServer.latency = server.latency;
      sortedServers.push(thisServer);
    });
    sortedServers.sort((a, b) => { return a.latency - b.latency; });
    return sortedServers;
  }

  alphaSort(servers) {
    let sortedServers = [];
    servers.forEach((server) => { sortedServers.push(server); });
    sortedServers.sort((a, b) => {
      if (a.name > b.name) { return 1; }
      else if (a.name < b.name) { return -1; }
      else { return 0; }
    });
    return sortedServers;
  }

  switchServerOrder(type: string) {
    this.serverSortOrder = type;
    if (type === 'geo') { this.currentServers = this.geoServers; }
    else if (type === 'latency') { this.currentServers = this.latencyServers; }
    else if (type === 'alpha') { this.currentServers = this.alphaServers; }
  }

}
