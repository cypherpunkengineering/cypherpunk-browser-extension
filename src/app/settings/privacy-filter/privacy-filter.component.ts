import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';

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

  constructor(private settingsService: SettingsService) {}

  toggleBlockAds(enabled: boolean) {
    this.settingsService.savePrivacyFilterAds(enabled);
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });
  }

  toggleBlockMalware(enabled: boolean) {
    this.settingsService.savePrivacyFilterMalware(enabled);
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }

}
