import { Component, EventEmitter, Output } from '@angular/core';
import { ProxySettingsService } from '../../../proxy-settings.service';
import { SettingsService } from '../../../settings.service';

@Component({
  selector: 'app-specific-server',
  templateUrl: './specific-server.component.html'
})
export class SpecificServerComponent {
  @Output() changeView = new EventEmitter<string>();
  regions = {};
  serverArr = [];
  starredServers = [];
  premiumAccount: boolean;
  selectedServerId: string;

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {
    this.regions = this.proxySettingsService.regions;
    this.starredServers = settingsService.starredServers;
    this.serverArr = this.proxySettingsService.serverArr;
    this.premiumAccount = this.proxySettingsService.premiumProxyAccount;
    
    if (settingsService.defaultRoutingSettings().selected) {
      this.selectedServerId = settingsService.defaultRoutingSettings().selected;
    }
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

  selectProxy(server) {
    if (server.level === 'premium' && !this.premiumAccount) { return; }
    else if (!server.enabled) { return; }
    else if (!server.httpDefault.length) { return; }
    else {
      this.selectedServerId = server.id;
      this.settingsService.saveRoutingInfo('SELECTED', server.id);
      this.proxySettingsService.enableProxy();
      this.settingsService.updateServerUsage(server.id);
    }
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
