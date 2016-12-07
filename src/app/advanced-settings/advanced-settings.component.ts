import { Component, Input, Output } from '@angular/core';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './advanced-settings.component.html'
})
export class AdvancedSettingsComponent {
  title = 'Advanced Settings';
  advancedSettings = this.settingsService.advancedSettings();
  defaultRouting = () => {
    let type = this.advancedSettings.defaultRouting.type;
    if (type === 'SMART') { return 'Smart Routing'; }
    else if (type === 'FASTEST') { return 'Fastest Server'; }
    else if (type === 'SPECIFIC') { return 'Specific Server'; }
    else { return 'No Proxy'; }
  };
  forceHttpsEnabled = this.advancedSettings.forceHttps;
  webRtcLeakProtectionEnabled = this.advancedSettings.webRtcLeakProtection;
  userAgentType = this.advancedSettings.userAgentType;

  constructor(private settingsService: SettingsService) {}

  toggleForceHttps(enabled: boolean) {
    console.log('Force HTTPS:', enabled);
    this.settingsService.saveForceHttps(enabled);
    chrome.runtime.sendMessage({greeting: "ForceHTTPS"});
  }

  toggleWebRtcLeakProtection(enabled: boolean) {
    console.log('WebRTC Leak Protection:', enabled);
    this.settingsService.saveWebRtcLeakProtection(enabled);
  }
}

