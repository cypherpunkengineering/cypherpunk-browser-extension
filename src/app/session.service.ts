import { HqService } from './hq.service';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

class Keys {
  public static ACCOUNT_ID = 'cypherpunk.account.id';
  public static ACCOUNT_EMAIL = 'cypherpunk.account.email';
  public static ACCOUNT_CONFIRMED = 'cypherpunk.account.confirmed';
  public static ACCOUNT_TYPE = 'cypherpunk.account.type';
  public static PRIVACY_USERNAME = 'cypherpunk.privacy.username';
  public static PRIVACY_PASSWORD = 'cypherpunk.privacy.password';
  public static SECRET = 'cypherpunk.secret';
  public static SUBSCRIPTION_ACTIVE = 'cypherpunk.subscription.active';
  public static SUBSCRIPTION_EXPIRATION = 'cypherpunk.subscription.expiration';
  public static SUBSCRIPTION_RENEWAL = 'cypherpunk.subscription.renewal';
  public static SUBSCRIPTION_RENEWS = 'cypherpunk.subscription.renews';
  public static SUBSCRIPTION_TYPE = 'cypherpunk.subscription.type';
}

@Injectable()
export class SessionService {
  user = {
    account: {
      id: '',
      email: '',
      confirmed: false,
      type: 'free'
    },
    privacy: {
      username: '',
      password: ''
    },
    secret: '',
    subscription: {
      active: false,
      expiration: {},
      renewal: '',
      renews: false,
      type: ''
    }
  };

  _user: BehaviorSubject<any>;

  constructor (private router: Router, private backend: HqService) {
    // User Observable
    this._user = new BehaviorSubject(this.user);

    // try to load user session from localStorage
    this.load();

    // Update extension session when updated by background script
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'UserUpdated') {
        console.log('Updating Session from background');
        this.load();
      }
    });
  }

  save(user) {
    this.saveAccountId(user.account.id);
    this.saveAccountEmail(user.account.email);
    this.saveAccountConfirmed(user.account.confirmed);
    this.saveAccountType(user.account.type);
    this.savePrivacyUsername(user.privacy.username);
    this.savePrivacyPassword(user.privacy.password);
    this.saveSecret(user.secret);
    this.saveSubscriptionActive(user.subscription.active);
    if (typeof user.subscription.expiration === 'string') {
      this.saveSubscriptionExpiration(new Date(user.subscription.expiration));
    }
    else if (typeof user.subscription.expiration === 'object') {
      this.saveSubscriptionExpiration(user.subscription.expiration);
    }
    this.saveSubscriptionRenewal(user.subscription.renewal);
    this.saveSubscriptionRenews(user.subscription.renews);
    this.saveSubscriptionType(user.subscription.type);

    let payload = { action: 'ProxyAuth', authUsername: user.privacy.password, authPassword: user.privacy.password }
    chrome.runtime.sendMessage(payload);

    this._user.next(this.user);
  }

  private load() {
    try {
      this.user.account.id = JSON.parse(localStorage.getItem(Keys.ACCOUNT_ID));
      this.user.account.email = JSON.parse(localStorage.getItem(Keys.ACCOUNT_EMAIL));
      this.user.account.confirmed = JSON.parse(localStorage.getItem(Keys.ACCOUNT_CONFIRMED));
      this.user.account.type = JSON.parse(localStorage.getItem(Keys.ACCOUNT_TYPE));
      this.user.privacy.username = JSON.parse(localStorage.getItem(Keys.PRIVACY_USERNAME));
      this.user.privacy.password = JSON.parse(localStorage.getItem(Keys.PRIVACY_PASSWORD));
      this.user.secret = JSON.parse(localStorage.getItem(Keys.SECRET));
      this.user.subscription.active = JSON.parse(localStorage.getItem(Keys.SUBSCRIPTION_ACTIVE));
      this.user.subscription.expiration = new Date(JSON.parse(localStorage.getItem(Keys.SUBSCRIPTION_EXPIRATION)));
      this.user.subscription.renewal = JSON.parse(localStorage.getItem(Keys.SUBSCRIPTION_RENEWAL));
      this.user.subscription.renews = JSON.parse(localStorage.getItem(Keys.SUBSCRIPTION_RENEWS));
      this.user.subscription.type = JSON.parse(localStorage.getItem(Keys.SUBSCRIPTION_TYPE));

      if (!this.user.subscription.type) { this.router.navigate(['/login']); }

      this._user.next(this.user);
    }
    catch (err) { console.log(err); }
  }

  clear() {
    this.user.account.id = '';
    localStorage.removeItem(Keys.ACCOUNT_ID);
    this.user.account.email = '';
    localStorage.removeItem(Keys.ACCOUNT_EMAIL);
    this.user.account.confirmed = false;
    localStorage.removeItem(Keys.ACCOUNT_CONFIRMED);
    this.user.account.type = 'free';
    localStorage.removeItem(Keys.ACCOUNT_TYPE);
    this.user.privacy.username = '';
    localStorage.removeItem(Keys.PRIVACY_USERNAME);
    this.user.privacy.password = '';
    localStorage.removeItem(Keys.PRIVACY_PASSWORD);
    this.user.secret = '';
    localStorage.removeItem(Keys.SECRET);
    this.user.subscription.active = false;
    localStorage.removeItem(Keys.SUBSCRIPTION_ACTIVE);
    this.user.subscription.expiration = '';
    localStorage.removeItem(Keys.SUBSCRIPTION_EXPIRATION);
    this.user.subscription.renewal = '';
    localStorage.removeItem(Keys.SUBSCRIPTION_RENEWAL);
    this.user.subscription.renews = false;
    localStorage.removeItem(Keys.SUBSCRIPTION_RENEWS);
    this.user.subscription.type = '';
    localStorage.removeItem(Keys.SUBSCRIPTION_TYPE);
  }


  /* User Observable */

  getObservableUser() {
    return this._user.asObservable();
  }


  /* Setters */

  saveAccountId(id: string) {
    this.user.account.id = id;
    localStorage.setItem(Keys.ACCOUNT_ID, JSON.stringify(id));
  }

  saveAccountEmail(email: string) {
    this.user.account.email = email;
    localStorage.setItem(Keys.ACCOUNT_EMAIL, JSON.stringify(email));
  }

  saveAccountConfirmed(confirmed: boolean) {
    this.user.account.confirmed = confirmed;
    localStorage.setItem(Keys.ACCOUNT_CONFIRMED, JSON.stringify(confirmed));
  }

  saveAccountType(accountType: string) {
    this.user.account.type = accountType;
    localStorage.setItem(Keys.ACCOUNT_TYPE, JSON.stringify(accountType));
  }

  savePrivacyUsername(username: string) {
    this.user.privacy.username = username;
    localStorage.setItem(Keys.PRIVACY_USERNAME, JSON.stringify(username));
  }

  savePrivacyPassword(password: string) {
    this.user.privacy.password = password;
    localStorage.setItem(Keys.PRIVACY_PASSWORD, JSON.stringify(password));
  }

  saveSecret(secret: string) {
    this.user.secret = secret;
    localStorage.setItem(Keys.SECRET, JSON.stringify(secret));
  }

  saveSubscriptionActive(active: boolean) {
    this.user.subscription.active = active;
    localStorage.setItem(Keys.SUBSCRIPTION_ACTIVE, JSON.stringify(active));
  }

  saveSubscriptionExpiration(expiration) {
    this.user.subscription.expiration = expiration;
    localStorage.setItem(Keys.SUBSCRIPTION_EXPIRATION, JSON.stringify(expiration));
  }

  saveSubscriptionRenewal(renewal: string) {
    this.user.subscription.renewal = renewal;
    localStorage.setItem(Keys.SUBSCRIPTION_RENEWAL, JSON.stringify(renewal));
  }

  saveSubscriptionRenews(renews: boolean) {
    this.user.subscription.renews = renews;
    localStorage.setItem(Keys.SUBSCRIPTION_RENEWS, JSON.stringify(renews));
  }

  saveSubscriptionType(type: string) {
    this.user.subscription.type = type;
    localStorage.setItem(Keys.SUBSCRIPTION_TYPE, JSON.stringify(type));
  }
}
