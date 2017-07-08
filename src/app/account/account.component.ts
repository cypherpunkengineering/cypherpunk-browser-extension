import { Router } from '@angular/router';
import { Component, NgZone } from '@angular/core';
import { HqService } from '../hq.service';
import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent {
  expired: boolean;
  accountType: string;
  user = {
    account: { type: '', email: '' },
    subscription: { renews: false, type: '', expiration: '' },
    secret: ''
  };

  constructor(
    private zone: NgZone,
    private router: Router,
    private hqService: HqService,
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {
    hqService.fetchUserStatus().subscribe(
      data => { this.user = data; },
      err => { /* do nothing */ }
    );
  }

  open(url: string) { chrome.tabs.create({ url: url }); }

  renew() {
    if (this.user.account) {
      let renewUrl = 'https://cypherpunk.com/account/upgrade?user=';
      renewUrl += `${this.user.account.email}&secret=${this.user.secret}`;
      chrome.tabs.create({ url: renewUrl });
    }
  }

  getType () {
    let type = this.user.account.type;
    if (type && type === 'free') { return 'free'; }
    else if (type && type !== 'free') { return 'premium'; }
  }

  getAccountType() {
    /// if account type === premium and subscription.renews === false
    /// or if account type === expired
    let type = this.user.account.type;
    let renews = this.user.subscription.renews;
    if (type === 'premium' && !renews) { this.accountType = 'EXPIRES'; }
    else if (type === 'expired') { this.accountType = 'EXPIRED'; }
    else { this.accountType = 'NORMAL'; }
    return this.accountType;
  }

  printEmail() {
    let email = '';
    if (this.user.account) { email = this.user.account.email; }
    return email;
  }

  printType() {
    let accountType = this.user.account.type;
    if (accountType === 'Expired') { this.expired = true; }
    else { this.expired = false; }
    return accountType + ' Account';
  }

  printRenewal(): any {
    let subscriptionType = this.user.subscription.type;

    if (this.accountType === 'NORMAL') {
      if (subscriptionType === 'monthly') { return '1 Month Plan'; }
      else if (subscriptionType === 'semiannually') { return '6 Month Plan'; }
      else if (subscriptionType === 'annually') { return '12 Month Plan'; }
      else if (subscriptionType === 'forever') { return 'Lifetime'; }
      else { return ''; }
    }
    else if (this.accountType === 'EXPIRES' && this.user.subscription.expiration) {
      let expiration = new Date(this.user.subscription.expiration);
      let now = new Date();
      let oneDay = 24 * 60 * 60 * 1000;
      let days = Math.ceil(Math.abs((expiration.getTime() - now.getTime()) / (oneDay)));
      return days;
    }
    else if (this.accountType === 'EXPIRED') {
      return this.user.subscription.expiration;
    }
    else { return ''; }
  }

  showRenews() {
    let sub = this.user.subscription;
    if (sub && sub.renews === false) { return true; }
    else { return false; }
  }

  goToPage(url: string) {
    let urlPrepend = 'https://cypherpunk.com';
    chrome.tabs.create({ url: urlPrepend + url });
  }

  logout() {
    this.proxySettingsService.disableProxy();
    let config = { 'url': 'https://api.cypherpunk.com', 'name': 'cypherpunk.session' };
    chrome.cookies.remove(config, (deleted_cookie) => {
      this.zone.run(() => {
        console.log('DELETED COOKIE', deleted_cookie);
        this.router.navigate(['/login']);
      });
    });
    this.settingsService.saveCypherpunkEnabled(false);
    chrome.runtime.sendMessage({ action: 'CypherpunkEnabled' });
  }
}
