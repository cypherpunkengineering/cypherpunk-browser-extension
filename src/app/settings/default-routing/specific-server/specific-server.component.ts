import { Component, EventEmitter, Output } from '@angular/core';
import { ProxySettingsService } from '../../../proxy-settings.service';
import { SettingsService } from '../../../settings.service';

@Component({
  selector: 'app-specific-server',
  templateUrl: './specific-server.component.html'
})
export class SpecificServerComponent {
  @Output() changeView = new EventEmitter<string>();

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
    else if (!server.enabled) { return; }
    else if (!server.httpDefault.length) { return; }
    else {
      this.selectedServerId = server.id;
      this.settingsService.saveRoutingInfo('SELECTED', server.id);
      this.proxySettingsService.enableProxy();
    }
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
