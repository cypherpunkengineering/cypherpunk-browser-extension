import { Component, EventEmitter, Output } from '@angular/core';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-user-agent',
  templateUrl: './user-agent.component.html',
  styleUrls: ['./user-agent.component.scss']
  // styles: [':host { z-index: 2; width: 100%; height: 100%; display: block; position: absolute; }'],
  // host: { '[@routeAnimation]': 'true' },
  // animations: Animations.slideFromLeft
})
export class UserAgentComponent {
  @Output() changeView = new EventEmitter<string>();

  selectedUserAgentType = this.settingsService.userAgentType;

  userAgentStrings = {
    default: false,
    private: 'Private',
    ios: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36 Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/546.10 (KHTML, like Gecko) Version/6.0 Mobile/7E18WD Safari/8536.25',
    android: 'Mozilla/5.0 (Linux; Android 4.1.2; GT-I9105P Build/JZO54K) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19',
  }

  constructor(private settingsService: SettingsService) {}

  setUserAgent(type: string) {
    this.selectedUserAgentType = type;
    this.settingsService.saveUserAgent(type, this.userAgentStrings[type.toLowerCase()]);
    chrome.runtime.sendMessage({ action: 'UserAgentSpoofing' });
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }

}
