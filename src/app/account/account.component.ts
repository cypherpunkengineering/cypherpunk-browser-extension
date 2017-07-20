import { Router } from '@angular/router';
import { Component, NgZone } from '@angular/core';
import { SessionService } from '../session.service';
import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent {
  expired: boolean;
  showRenew: boolean;
  accountDisplayType: string;
  user = {
    account: { id: '', type: '', email: '', confirmed: false },
    subscription: { active: false, renewal: '', renews: false, type: '', expiration: {} },
    secret: '',
    privacy: { username: '', password: '' }
  };

  constructor(
    private zone: NgZone,
    private router: Router,
    private session: SessionService,
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) { this.user = session.user; }

  open(url: string) { chrome.tabs.create({ url: url }); }

  renew() {
    if (this.user.account) {
      let renewUrl = 'https://cypherpunk.com/account/upgrade?user=';
      renewUrl += `${this.user.account.email}&secret=${this.user.secret}`;
      chrome.tabs.create({ url: renewUrl });
    }
  }

  /*
   * Returns only free or premium
   * This is for the header image on the account view
   */
  getType () {
    let type = this.user.account.type;
    if (type && type === 'free') { return 'free'; }
    else if (type && type !== 'free') { return 'premium'; }
  }

  printEmail() {
    return this.user.account.email;
  }

  /*
   * Prints the Account Type on the account view
   */
  printType() {
    return this.user.account.type + ' Account';
  }

  printRenewal() {
    let now = new Date();
    let forever = new Date('0');
    let exp = <Date>this.user.subscription.expiration;
    let plan = this.user.subscription.type;
    let renews = this.user.subscription.renews;
    let limit = (plan === 'annually' || plan === 'semiannually') ? 30 : 7;
    let diff = (exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);

    // Lifetime account
    if (exp.getTime() === forever.getTime()) { return 'Lifetime'; }
    // Expiration expired
    else if (exp < now) {
      this.expired = true;
      this.showRenew = true;
      return `Expired on ${exp.getMonth() + 1}/${exp.getDate()}/${exp.getFullYear()}`;
    }
    // Close to expiration
    else if (diff <= limit) {
      this.showRenew = true;
      return (renews ? 'Renews ' : 'Expires ') + this.printTimeDiff(exp, now);
    }
    // Annual plan
    else if (plan === 'annually') { return '12 Month Plan'; }
    // Semiannual Plan
    else if (plan === 'semiannually') { return '6 Month Plan'; }
    // Monthly Plan
    else if (plan === 'monthly') { return '1 Month Plan'; }
    // errrr....
    else { return ''; }
  }

  printTimeDiff(expiration, now) {
    let diff = (expiration.getTime() - now.getTime()) / (60 * 60 * 1000); // hours

    if (diff < 0) {
      this.expired = true;
      diff = -diff;
      if (diff < 1) { return 'just now'; }
      else if (diff <= 2) { return 'an hour ago'; }
      else if (diff < 6) { return 'less than six hours ago'; }
      else if (diff <= 2 * 24) {
        if (expiration.getDate() === now.getDate()) { return 'today'; }
        let yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (expiration.getDate() === yesterday.getDate()) { return 'yesterday'; }
      }

      if (diff <= 30 * 24) { return `${Math.ceil(diff / 24).toFixed()} days ago`; }
      else if (diff <= 50 * 24) { return `${Math.ceil(diff / (7 * 24)).toFixed()} weeks ago`; }
      else if (diff <= 300 * 24) { return `${Math.ceil(diff / (30 * 24)).toFixed()} months ago`; }
      else if (diff <= 400 * 24) { return 'a year ago'; }
      else { return 'over a year ago'; }
    }
    else {
      this.expired = false;
      if (diff < 1) { return 'in less than an hour'; }
      else if (diff < 6) { return 'in less than six hours'; }
      else if (diff <= 2 * 24) {
        if (expiration.getDate() === now.getDate()) { return 'today'; }
        let tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        if (expiration.getDate() === tomorrow.getDate()) { return 'tomorrow'; }
      }
      if (diff <= 30 * 24) { return `in ${Math.ceil(diff / 24).toFixed()} days`; }
      else if (diff <= 50 * 24) { return `in ${Math.ceil(diff / (7 * 24)).toFixed()} weeks`; }
      else if (diff <= 300 * 24) { return `in ${Math.ceil(diff / (30 * 24)).toFixed()} months`; }
      else if (diff <= 400 * 24) { return 'in one year'; }
      else { return 'in over a year'; }
    }
  }

  goToPage(url: string) {
    let urlPrepend = 'https://cypherpunk.com';
    chrome.tabs.create({ url: urlPrepend + url });
  }

  logout() {
    this.proxySettingsService.disableProxy();
    this.settingsService.saveCypherpunkEnabled(false);
    chrome.runtime.sendMessage({ action: 'CypherpunkEnabled' });

    let config = { 'url': 'https://api.cypherpunk.com', 'name': 'cypherpunk.session' };
    chrome.cookies.remove(config, (deleted_cookie) => {
      this.zone.run(() => {
        console.log('DELETED COOKIE', deleted_cookie);
        this.session.clear();
        // clearh server data
        this.settingsService.clearServers();
        this.router.navigate(['/login']);
      });
    });
  }
}
