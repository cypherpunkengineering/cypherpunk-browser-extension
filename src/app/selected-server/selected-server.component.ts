import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';
import { Component, style, animate, transition, state, trigger } from '@angular/core';

@Component({
  selector: 'app-selected-server',
  templateUrl: './selected-server.component.html',
  styleUrls: ['./selected-server.component.scss'],
  styles: [':host { z-index: 2; width: 100%; height: 100%; display: block; position: absolute; }'],
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
export class SelectedServerComponent {
  regions = {};
  serverMap = {};
  searchText = '';
  serverSortOrder = 'geo';
  geoServers = [];
  alphaServers = [];
  starredServers = [];
  latencyServers = [];
  currentServers = [];
  accountType: string;
  selectedServerId: string;

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {
    this.regions = this.proxySettingsService.regions;
    this.serverMap = this.proxySettingsService.servers;
    this.geoServers = this.appendLatency(this.proxySettingsService.serverArr);
    this.latencyServers = this.latencySort(this.settingsService.latencyList);
    this.alphaServers = this.alphaSort(this.geoServers);
    this.starredServers = settingsService.starredServers;
    this.currentServers = this.geoServers;
    this.accountType = this.settingsService.proxySettingsService().accountType;

    if (settingsService.defaultRoutingSettings().selected) {
      this.selectedServerId = settingsService.defaultRoutingSettings().selected;
    }
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
    console.log(this.accountType);
    if (server.level === 'premium' && this.accountType === 'free') { return true; }
    else if (!server.enabled) { return true; }
    else if (!server.httpDefault.length) { return true; }
    else { return false; }
  }

  selectProxy(server) {
    if (server.level === 'premium' && this.accountType === 'free') { return; }
    else if (!server.enabled) { return; }
    else if (!server.httpDefault.length) { return; }
    else {
      this.selectedServerId = server.id;
      this.settingsService.saveRoutingInfo('SELECTED', server.id);
      this.proxySettingsService.enableProxy();
      this.settingsService.updateServerUsage(server.id);
    }
  }
}
