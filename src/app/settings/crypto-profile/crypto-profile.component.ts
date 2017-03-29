import { SettingsService } from '../../settings.service';
import { Component, EventEmitter, Output } from '@angular/core';
import { ProxySettingsService } from '../../proxy-settings.service';

@Component({
  selector: 'app-crypto-profile',
  templateUrl: './crypto-profile.component.html',
  styleUrls: ['./crypto-profile.component.scss']
})
export class CryptoProfileComponent {
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
