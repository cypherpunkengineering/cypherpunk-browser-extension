import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';
import { Component, style, animate, transition, state, trigger } from '@angular/core';

@Component({
  selector: 'app-selected-server',
  templateUrl: './selected-server.component.html',
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
}
