import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';
import { ProxySettingsService } from '../../proxy-settings.service';

@Component({
  selector: 'app-privacy-filter',
  templateUrl: './privacy-filter.component.html'
})
export class PrivacyFilterComponent {
  @Output() changeView = new EventEmitter<string>();

  title = 'Privacy Filter Settings';

  privacyFilterSettings = this.settingsService.privacyFilterSettings();
  blockAds = this.privacyFilterSettings.blockAds;
  blockMalware = this.privacyFilterSettings.blockMalware;

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {}

  toggleBlockAds(enabled: boolean) {
    this.settingsService.savePrivacyFilterAds(enabled);
    this.proxySettingsService.enableProxy();
  }

  toggleBlockMalware(enabled: boolean) {
    this.settingsService.savePrivacyFilterMalware(enabled);
    this.proxySettingsService.enableProxy();
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }

}
