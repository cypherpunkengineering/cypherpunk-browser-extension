import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-web-rtc',
  templateUrl: './web-rtc.component.html'
})
export class WebRtcComponent {
  @Output() changeView = new EventEmitter<string>();

  title = 'WebRTC Leak Prevention';
  webRTCSettings = this.settingsService.webRtcSettings();
  selectedWebRTCType = this.webRTCSettings.webRtcLeakProtection;

  constructor(private settingsService: SettingsService) {}

  setWebRTCIPHandlingPolicy(type: string) {
    this.selectedWebRTCType = type;
    this.settingsService.saveWebRtcLeakProtection(type);
    chrome.runtime.sendMessage({ action: 'UpdateWebRTCPolicy' });
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
