import { Router } from '@angular/router';
import { SettingsService } from '../../settings.service';
import { ProxySettingsService } from '../../proxy-settings.service';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent {
  @Input() user;
  @Output() changeView = new EventEmitter<string>();

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) { }

  open(url: string) { chrome.tabs.create({ url: url }); }

  printEmail() {
    if (this.user && this.user.account) { return this.user.account.email; }
    else { return ''; }
  }

  printType() {
    if (this.user && this.user.account) { return this.user.account.type; }
    else { return ''; }
  }

  printRenewal() {
    if (this.user && this.user.subscription) { return this.user.subscription.renewal; }
    else { return ''; }
  }

  goToPage(url: string) {
    let urlPrepend = 'https://cypherpunk.com';
    chrome.tabs.create({ url: urlPrepend + url });
  }

  logout() {
    this.proxySettingsService.disableProxy();
    let config = { 'url': 'https://cypherpunk.privacy.network', 'name': 'cypherpunk.session' };
    chrome.cookies.remove(config, (deleted_cookie) => {
      console.log('DELETED COOKIE', deleted_cookie);
      this.router.navigate(['/login']);
    });
    this.settingsService.saveCypherpunkEnabled(false);
    chrome.runtime.sendMessage({ action: 'CypherpunkEnabled' });
  }

  goToView(name: string) { this.changeView.emit(name); }
}
