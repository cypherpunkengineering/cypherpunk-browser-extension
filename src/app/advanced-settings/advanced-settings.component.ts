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
    let type = this.advancedSettings.defaultRouting;
    if (type === 'smart') { return 'Smart Routing'; }
    else if (type === 'fastest') { return 'Fastest Routing'; }
    else if (type === 'specific') { return 'Specific Server'; }
    else { return 'No Proxy'; }
  };
  forceHttpsEnabled = this.advancedSettings.forceHttps;
  webRtcLeakProtectionEnabled = this.advancedSettings.webRtcLeakProtection;

  userAgent = () => {
    let agent = this.advancedSettings.userAgent;
    if (!agent) { return 'PRIVATE'; }
    else { return agent; }
  };

  constructor(private settingsService: SettingsService) {}

  toggleForceHttps(enabled: boolean) {
    console.log('Force HTTPS:', enabled);
    this.settingsService.saveForceHttps(enabled);
  }

  toggleWebRtcLeakProtection(enabled: boolean) {
    console.log('WebRTC Leak Protection:', enabled);
    this.settingsService.saveWebRtcLeakProtection(enabled);
  }
}

