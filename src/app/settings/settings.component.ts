import { Component, EventEmitter, Input, Output } from '@angular/core';
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

  webRtcLeakProtectionEnabled = this.advancedSettings.webRtcLeakProtection;
  userAgentType = this.advancedSettings.userAgentType;
  webRTCType = this.webRTCDesc[this.advancedSettings.webRtcLeakProtection.toString()];

  constructor(private settingsService: SettingsService, private proxySettingsService: ProxySettingsService) {}

  defaultRouting() {
    let type = this.advancedSettings.defaultRouting.type;
    if (type === 'SMART') { return 'Smart Routing'; }
    else if (type === 'FASTEST') { return 'Fastest Server'; }
    else if (type === 'SELECTED') { return 'Specific Server'; }
    else { return 'No Proxy'; }
  }

  logout() {
    this.proxySettingsService.disableProxy();
    chrome.cookies.remove({"url": "https://cypherpunk.com", "name": "cypherpunk.session"}, function(deleted_cookie) { console.log("DELETED COOKIE", deleted_cookie); });
    chrome.cookies.remove({"url": "https://cypherpunk.privacy.network", "name": "cypherpunk.session"}, function(deleted_cookie) { console.log("DELETED COOKIE", deleted_cookie); });
    this.settingsService.saveCypherpunkEnabled(false);
    chrome.runtime.sendMessage({ action: "CypherpunkEnabled" });
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}

