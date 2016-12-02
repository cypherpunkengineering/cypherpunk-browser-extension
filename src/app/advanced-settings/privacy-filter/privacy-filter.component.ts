import { Component, Input, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './privacy-filter.component.html'
})
export class PrivacyFilterComponent {
  title = 'Privacy Filter Settings';

  privacyFilterSettings = this.settingsService.privacyFilterSettings();
  privacyFilterEnabled = this.privacyFilterSettings.enabled;
  blockAds = this.privacyFilterSettings.blockAds;
  blockTrackers = this.privacyFilterSettings.blockTrackers;
  blockMalware = this.privacyFilterSettings.blockMalware;

  constructor(private settingsService: SettingsService) {}

  togglePrivacyFilterEnabled(enabled: boolean) {
    this.settingsService.savePrivacyFilterEnabled(enabled);
  }

  toggleBlockAds(enabled: boolean) {
    this.settingsService.savePrivacyFilterAds(enabled);
  }

  toggleBlockTrackers(enabled: boolean) {
    this.settingsService.savePrivacyFilterTrackers(enabled);
  }

  toggleBlockMalware(enabled: boolean) {
    this.settingsService.savePrivacyFilterMalware(enabled);
  }

}

