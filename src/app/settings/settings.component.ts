import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
  // styles: [':host { z-index: 1; width: 100%; height: 100%; display: block; position: absolute; }'],
  // host: { '[@routeAnimation]': 'true' },
  // animations: Animations.slideFromLeft
})
export class SettingsComponent {
  @Output() changeView = new EventEmitter<string>();
  browserObj: any = chrome ? chrome : chrome;

  title = 'Settings';
  advancedSettings = this.settingsService.advancedSettings();
  defaultRouting = () => {
    let type = this.advancedSettings.defaultRouting.type;
    if (type === 'SMART') { return 'Smart Routing'; }
    else if (type === 'CLOSEST') { return 'Fastest Server'; }
    else if (type === 'SELECTED') { return 'Specific Server'; }
    else { return 'No Proxy'; }
  };
// forceHttpsEnabled = this.advancedSettings.forceHttps;
//  webRtcLeakProtectionEnabled = this.advancedSettings.webRtcLeakProtection;
  userAgentType = this.advancedSettings.userAgentType;

  constructor(private settingsService: SettingsService) {}

  // toggleForceHttps(enabled: boolean) {
  //   console.log('Force HTTPS:', enabled);
  //   this.settingsService.saveForceHttps(enabled);
  //   this.browserObj.runtime.sendMessage({ action: "ForceHTTPS" });
  // }

  // toggleWebRtcLeakProtection(enabled: boolean) {
  //   console.log('WebRTC Leak Protection:', enabled);
  //   this.settingsService.saveWebRtcLeakProtection(enabled);
  // }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}

