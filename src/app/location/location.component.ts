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
  accountType: string;

  siteName: string;
  siteUrl: string;
  favIconUrl: string;

  overrides: any;
  proxyMode: string;
  selectedServerId = '';
  blockAds = false;
  blockMalware = false;
  hasOverrides = false;

  regions = {};
  serverMap = {};
  searchText = '';
  serverSortOrder = 'geo';
  geoServers = [];
  alphaServers = [];
  latencyServers = [];
  currentServers = [];
  starredServers = [];
  showServers = false;

  constructor(
    private zone: NgZone,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {
    // load default settings
    this.accountType = this.settingsService.accountType;
    this.overrides = this.settingsService.siteOverrides;
    this.blockAds = this.settingsService.privacyFilterAds;
    this.blockMalware = this.settingsService.privacyFilterMalware;
    this.regions = this.proxySettingsService.regions;
    this.serverMap = this.proxySettingsService.servers;
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

      let protocol = tabs[0].url ? tabs[0].url.split('://')[0] : null;
      let validProtocol = protocol === 'http' || protocol === 'https';

      // Load site fav icon
      if (tabs[0].favIconUrl && tabs[0].favIconUrl !== '' && tabs[0].favIconUrl.indexOf('chrome://favicon/') === -1 && validProtocol) {
        this.favIconUrl = tabs[0].favIconUrl;
      }

      // load overrides from settings
      let localOverrides = this.overrides[this.siteUrl];
      if (localOverrides && validProtocol) {
        this.hasOverrides = true;

        // set proxy connection type
        if (localOverrides.type) { this.proxyMode = localOverrides.type; }
        if (this.proxyMode === 'SELECTED') { this.showServers = true; }

        // set proxy connection server
        if (localOverrides.serverId) { this.selectedServerId = localOverrides.serverId; }

        // set block ads
        if (localOverrides.blockAds !== undefined) { this.blockAds = localOverrides.blockAds; }

        // set block malware
        if (localOverrides.blockMalware !== undefined) {
          this.blockMalware = localOverrides.blockMalware;
        }
      }
    });
  }

  toggleBlockAds(enabled: boolean) {
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.blockAds = enabled; }
    else { currentEntry = { blockAds: enabled }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  toggleBlockMalware(enabled: boolean) {
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.blockMalware = enabled; }
    else { currentEntry = { blockMalware: enabled }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useCypherplay() {
    this.proxyMode = 'SMART';
    this.selectedServerId = '';
    this.showServers = false;
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.type = 'SMART'; currentEntry.serverId = ''; }
    else { currentEntry = { type: 'SMART' }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useFastest() {
    this.proxyMode = 'FASTEST';
    this.selectedServerId = '';
    this.showServers = false;
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.type = 'FASTEST'; currentEntry.serverId = ''; }
    else { currentEntry = { type: 'FASTEST' }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useFastestUK() {
    this.proxyMode = 'FASTESTUK';
    this.selectedServerId = '';
    this.showServers = false;
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.type = 'FASTESTUK'; currentEntry.serverId = ''; }
    else { currentEntry = { type: 'FASTESTUK' }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useFastestUS() {
    this.proxyMode = 'FASTESTUS';
    this.selectedServerId = '';
    this.showServers = false;
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.type = 'FASTESTUS'; currentEntry.serverId = ''; }
    else { currentEntry = { type: 'FASTESTUS' }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  useNoProxy() {
    this.proxyMode = 'NONE';
    this.selectedServerId = '';
    this.showServers = false;
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.type = 'NONE'; currentEntry.serverId = ''; }
    else { currentEntry = { type: 'NONE' }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  selectProxy(server) {
    this.proxyMode = 'SELECTED';
    let valid: any = true;
    if (server.level === 'premium' && this.accountType === 'free') { valid = false; }
    else if (!server.enabled) { valid = false; }
    else if (!server.httpDefault.length) { valid = false; }

    if (valid === true) {
      this.selectedServerId = server.id;
      let currentEntry = this.overrides[this.siteUrl];
      if (currentEntry) { currentEntry.type = 'SELECTED'; currentEntry.serverId = server.id; }
      else { currentEntry = { type: 'SELECTED', serverId: server.id }; }
      this.overrides[this.siteUrl] = currentEntry;
      this.settingsService.saveSiteOverrides(this.overrides);
      this.proxySettingsService.enableProxy();
      this.settingsService.updateServerUsage(server.id);
      this.hasOverrides = true;
    }
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

  resetSiteOverrides() {
    if (!this.hasOverrides) { return; }
    this.proxyMode = '';
    this.selectedServerId = '';
    this.blockAds = this.settingsService.privacyFilterAds;
    this.blockMalware = this.settingsService.privacyFilterMalware;
    this.hasOverrides = false;

    // reset privacy whitelist
    delete this.overrides[this.siteUrl];
    this.settingsService.saveSiteOverrides(this.overrides);
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });
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
