import { SettingsService } from '../../settings.service';
import { Component, EventEmitter, Output } from '@angular/core';
import { ProxySettingsService } from '../../proxy-settings.service';

@Component({
  selector: 'app-proxy-mode',
  templateUrl: './proxy-mode.component.html',
  styleUrls: ['./proxy-mode.component.scss']
})
export class ProxyModeComponent {
  @Output() changeView = new EventEmitter<string>();
  privacyMode: boolean;

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) { this.privacyMode = settingsService.privacyMode; }

  selectPrivacyMode(enabled: boolean) {
    this.privacyMode = enabled;
    this.settingsService.savePrivacyMode(enabled);
    this.proxySettingsService.enableProxy();
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
