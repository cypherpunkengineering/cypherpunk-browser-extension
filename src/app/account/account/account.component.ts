import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProxySettingsService } from '../../proxy-settings.service';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
})
export class AccountComponent {
  @Input() user;
  @Output() changeView = new EventEmitter<string>();

  constructor(
    private proxySettingsService: ProxySettingsService,
    private settingsService: SettingsService
  ) { }

  open(url: string) {
    chrome.tabs.create({ url: url });
  }

  goToPage(url: string) {
    let urlPrepend = 'https://cypherpunk.com';
    chrome.tabs.create({ url: urlPrepend + url });
  }

  logout() {
    this.proxySettingsService.disableProxy();
    chrome.cookies.remove({"url": "https://cypherpunk.com", "name": "cypherpunk.session"}, (deleted_cookie) => { console.log("DELETED COOKIE", deleted_cookie); });
    this.settingsService.saveCypherpunkEnabled(false);
    chrome.runtime.sendMessage({ action: "CypherpunkEnabled" });
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
