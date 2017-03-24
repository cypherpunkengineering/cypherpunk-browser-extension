import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  @Output() changeView = new EventEmitter<string>();

  webRTCDesc = {
    DEFAULT: 'Unprotected',
    DEFAULT_PUBLIC_INTERFACE_ONLY: 'Public Interfaces',
    DEFAULT_PUBLIC_AND_PRIVATE_INTERFACES: 'Public/Private Interfaces',
    DISABLE_NON_PROXIED_UDP: 'Non-Proxied UDP'
  };

  isFirefox: boolean;
  webRTCType: string;
  ffWebRTCType: string;
  userAgentType: string;

  constructor(
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {
    this.isFirefox = this.settingsService.isFirefox();
    this.userAgentType = this.settingsService.userAgentType;
    this.webRTCType = this.settingsService.webRtcLeakProtection;
    this.ffWebRTCType = this.settingsService.ffWebRtcLeakProtection ? 'On' : 'Off';
  }

  defaultRouting() {
    let type = this.settingsService.defaultRoutingType;
    if (type === 'SMART') { return 'CypherPlay'; }
    else if (type === 'FASTEST') { return 'Fastest Server'; }
    else if (type === 'FASTESTUK') { return 'Fastest UK Server'; }
    else if (type === 'FASTESTUS') { return 'Fastest US Server'; }
    else if (type === 'SELECTED') { return 'Specific Server'; }
    else if (type === 'STAR') { return 'Starred Server'; }
    else { return 'No Proxy'; }
  }

  goToView(name: string) { this.changeView.emit(name); }
}
