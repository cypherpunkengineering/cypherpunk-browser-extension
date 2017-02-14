import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';
import { ProxySettingsService } from '../../proxy-settings.service';

@Component({
  selector: 'app-default-routing',
  templateUrl: './default-routing.component.html',
})
export class DefaultRoutingComponent {
  @Output() changeView = new EventEmitter<string>();

  title = 'Default Routing';

  defaultRoutingSettings = this.settingsService.defaultRoutingSettings();
  defaultRoutingType = this.defaultRoutingSettings.type;
  defaultRoutingSelected = this.proxySettingsService.getServer(this.defaultRoutingSettings.selected).name || 'N/A';

  constructor(private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService) {}

  selectRoutingType(type: string) {
    this.defaultRoutingType = type;
    this.defaultRoutingSelected = 'N/A';
    this.settingsService.saveRoutingInfo(type, null);
    this.proxySettingsService.enableProxy();
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
