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

  blockAds = this.settingsService.privacyFilterAds;
  blockMalware = this.settingsService.privacyFilterMalware;

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {}

  toggleBlockAds(enabled: boolean) {
    this.settingsService.savePrivacyFilterAds(enabled);
    this.proxySettingsService.enableProxy();
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });
  }

  toggleBlockMalware(enabled: boolean) {
    this.settingsService.savePrivacyFilterMalware(enabled);
    this.proxySettingsService.enableProxy();
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }

}
