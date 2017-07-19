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
    this.webRTCType = this.parseWebRTCType(this.settingsService.webRtcLeakProtection);
    this.ffWebRTCType = this.parseWebRTCType(this.settingsService.ffWebRtcLeakProtection);
  }

  parseWebRTCType(type: string | boolean): string {
    if (type === 'Enabled') { return 'ENABLED'; }
    else if (type === 'Disabled') { return 'DISABLED'; }
    else if (type === 'DEFAULT') { return 'DEFAULT'; }
    else if (type === 'DEFAULT_PUBLIC_INTERFACE_ONLY') { return 'PUBLIC'; }
    else if (type === 'DEFAULT_PUBLIC_AND_PRIVATE_INTERFACES') { return 'PRIVATE'; }
    else if (type === 'DISABLE_NON_PROXIED_UDP') { return 'PROXIED'; }
    else if (type) { return 'ENABLED'; }
    else { return 'DISABLED'; }
  }

  updateWebRtc(type: string) {
    if (this.isFirefox) { this.ffWebRTCType = type; }
    else { this.webRTCType = this.parseWebRTCType(type); }
  }

  updateUserAgent(type: string) {
    this.userAgentType = type;
  }

  goToView(name: string) { this.changeView.emit(name); }
}
