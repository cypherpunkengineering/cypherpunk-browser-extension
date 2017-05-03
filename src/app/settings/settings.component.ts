import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  @Output() changeView = new EventEmitter<string>();
  isFirefox: boolean;
  webRTCType: string;
  ffWebRTCType: string;
  userAgentType: string;

  constructor(private settingsService: SettingsService) {
    this.isFirefox = this.settingsService.isFirefox();
    this.userAgentType = this.settingsService.userAgentType;
    this.webRTCType = this.settingsService.webRtcLeakProtection;
    this.ffWebRTCType = this.settingsService.ffWebRtcLeakProtection ? 'On' : 'Off';
  }

  goToView(name: string) { this.changeView.emit(name); }
}
