import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-web-rtc',
  templateUrl: './web-rtc.component.html',
  styleUrls: ['./web-rtc.component.scss']
})
export class WebRtcComponent {
  @Output() changeView = new EventEmitter<string>();
  @Output() updateWebRtc = new EventEmitter<string>();

  isFirefox: boolean;
  webRtcLeakProtection: string;
  ffWebRtcLeakProtection: boolean;

  constructor(private settingsService: SettingsService) {
    this.isFirefox = settingsService.isFirefox();
    this.ffWebRtcLeakProtection = settingsService.ffWebRtcLeakProtection;
    this.webRtcLeakProtection = settingsService.webRtcLeakProtection;
  }

  setWebRTCIPHandlingPolicy(type: string) {
    this.webRtcLeakProtection = type;
    this.settingsService.saveWebRtcLeakProtection(type);
    chrome.runtime.sendMessage({ action: 'UpdateWebRTCPolicy' });
    this.updateWebRtc.emit(type);
  }

  setFFWebRTCIPHandlingPolicy(enabled: boolean) {
    this.ffWebRtcLeakProtection = enabled;
    this.settingsService.saveFFWebRtcLeakProtection(enabled);
    if (enabled) { chrome.runtime.sendMessage({ action: 'EnableWebRTCLeakProtection' }); }
    else { chrome.runtime.sendMessage({ action: 'DisableWebRTCLeakProtection' }); }
    if (enabled) { this.updateWebRtc.emit('Enabled'); }
    else { this.updateWebRtc.emit('Disabled'); }
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
