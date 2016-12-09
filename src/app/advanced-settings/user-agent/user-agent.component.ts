import { Component, Input, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './user-agent.component.html'
})
export class UserAgentComponent {
  title = 'User Agent';
  userAgentSettings = this.settingsService.userAgentSettings();
  selectedUserAgentType = this.userAgentSettings.userAgentType;

  userAgentStrings = {
    default: false,
    private: '',
    ios: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36 Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/546.10 (KHTML, like Gecko) Version/6.0 Mobile/7E18WD Safari/8536.25',
    android: 'Mozilla/5.0 (Linux; Android 4.1.2; GT-I9105P Build/JZO54K) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19',
  }

  constructor(private settingsService: SettingsService) {}

  setUserAgent(type: string) {
    this.selectedUserAgentType = type;
    this.settingsService.saveUserAgent(type, this.userAgentStrings[type.toLowerCase()]);
    chrome.runtime.sendMessage({ greeting: "UserAgentSpoofing" });
  }

}

