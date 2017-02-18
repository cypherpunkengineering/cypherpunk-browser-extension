import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  @Output() changeView = new EventEmitter<string>();
  browserObj: any = chrome ? chrome : chrome;

  title = 'Settings';
  advancedSettings = this.settingsService.advancedSettings();

  webRTCDesc = {
    DEFAULT: 'Unprotected',
    DEFAULT_PUBLIC_INTERFACE_ONLY: 'Public Interfaces',
    DEFAULT_PUBLIC_AND_PRIVATE_INTERFACES: 'Public/Private Interfaces',
    DISABLE_NON_PROXIED_UDP: 'Non-Proxied UDP'
  };

  ffWebRtcLeakProtectionEnabled;
  webRTCType;

  userAgentType = this.advancedSettings.userAgentType;

  constructor(private settingsService: SettingsService, private proxySettingsService: ProxySettingsService) {
    if (this.settingsService.isFirefox()) {
      this.ffWebRtcLeakProtectionEnabled = this.advancedSettings['ffWebRtcLeakProtection'];
    }
    else {
      this.webRTCType = this.webRTCDesc[this.advancedSettings['webRtcLeakProtection']];
    }
  }

  defaultRouting() {
    let type = this.advancedSettings.defaultRouting.type;
    if (type === 'SMART') { return 'Smart Routing'; }
    else if (type === 'FASTEST') { return 'Fastest Server'; }
    else if (type === 'SELECTED') { return 'Specific Server'; }
    else { return 'No Proxy'; }
  }

  toggleFFWebRtcLeakProtection(enabled: boolean) {
    console.log('WebRTC Leak Protection:', enabled);
    this.settingsService.saveFFWebRtcLeakProtection(enabled);
    if (enabled) {
      chrome.runtime.sendMessage({ action: 'EnableWebRTCLeakProtection' });
    }
    else {
      chrome.runtime.sendMessage({ action: 'DisableWebRTCLeakProtection' });
    }
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
