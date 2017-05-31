import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';
import { ProxySettingsService } from '../../proxy-settings.service';

@Component({
  selector: 'app-privacy-filter',
  templateUrl: './privacy-filter.component.html',
  styleUrls: ['./privacy-filter.component.scss']
})
export class PrivacyFilterComponent {
  @Output() changeView = new EventEmitter<string>();

  isFirefox: boolean;
  blockAds = this.settingsService.privacyFilterAds;
  blockMalware = this.settingsService.privacyFilterMalware;
  microphoneProtection = this.settingsService.microphoneProtection;
  cameraProtection = this.settingsService.cameraProtection;
  locationProtection = this.settingsService.locationProtection;
  flashProtection = this.settingsService.flashProtection;

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {
    this.isFirefox = settingsService.isFirefox();
  }

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

  toggleMicrophoneProtection(enabled: boolean) {
    this.settingsService.saveMicrophoneProtection(enabled);
    chrome.runtime.sendMessage({ action: 'updateMicrophoneProtection' });
  }

  toggleCameraProtection(enabled: boolean) {
    this.settingsService.saveCameraProtection(enabled);
    chrome.runtime.sendMessage({ action: 'updateCameraProtection' });
  }

  toggleLocationProtection(enabled: boolean) {
    this.settingsService.saveLocationProtection(enabled);
    chrome.runtime.sendMessage({ action: 'updateLocationProtection' });
  }

  toggleFlashProtection(enabled: boolean) {
    this.settingsService.saveFlashProtection(enabled);
    chrome.runtime.sendMessage({ action: 'updateFlashProtection' });
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }

}
