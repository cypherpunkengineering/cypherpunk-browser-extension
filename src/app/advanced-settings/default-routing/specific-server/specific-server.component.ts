import { Component, Input, Output } from '@angular/core';
import { ProxySettingsService } from '../../../proxy-settings.service';
import { SettingsService } from '../../../settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './specific-server.component.html'
})
export class SpecificServerComponent {
  title = 'Use specific server';
  premiumAccount = this.proxySettingsService.premiumProxyAccount;
  serverArr = this.proxySettingsService.serverArr;
  selectedServerId = this.settingsService.defaultRoutingSettings().selected;
  regions = this.proxySettingsService.regions;

  constructor(
    private proxySettingsService: ProxySettingsService,
    private settingsService: SettingsService
  ) {}

  selectProxy(server) {
    if (server.level === 'premium' && !this.premiumAccount) { return; }
    else {
      this.selectedServerId = server.id;
      this.settingsService.saveRoutingInfo("SPECIFIC", server.id);
    }
  }
}

