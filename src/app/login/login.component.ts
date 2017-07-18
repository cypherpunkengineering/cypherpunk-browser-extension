import { Router } from '@angular/router';
import { HqService } from '../hq.service';
import { SessionService } from '../session.service';
import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';
import { Component, NgZone, ViewChild, ElementRef } from '@angular/core';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  @ViewChild('passwordInput') passwordInput: ElementRef;
  @ViewChild('registerPasswordInput') registerPasswordInput: ElementRef;
  currentView = 'email';
  emailClassList = ['middle'];
  loginClassList = ['right'];
  registerClassList = ['right'];
  errors = { login: false, register: false };
  disableEmail = false;
  disableLogin = false;
  disableRegister = false;
  user = { email: '', password: '' };

  constructor(
    private zone: NgZone,
    private router: Router,
    private hqService: HqService,
    private session: SessionService,
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService,
  ) { this.settingsService.saveTutorialFinished(true); }

  checkEmail() {
    if (!this.user.email) { return; }
    this.disableEmail = true;

    let body = { email: this.user.email };
    this.hqService.identifyEmail(body, {})
    .subscribe(
      (data) => {
        this.disableEmail = false;
        this.currentView = 'login';
        this.emailClassList = ['left'];
        this.loginClassList = ['middle'];

        setTimeout(() => { this.passwordInput.nativeElement.focus(); }, 500);
      },
      (error) => {
        this.disableEmail = false;
        if (error.status === 401) {
          this.currentView = 'register';
          this.emailClassList = ['left'];
          this.registerClassList = ['middle'];

          setTimeout(() => { this.registerPasswordInput.nativeElement.focus(); }, 500);
        }
        if (error.status === 402) { this.router.navigate(['pending']); }
        else { return; }
      }
    );
  }

  login() {
    this.disableLogin = true;
    let body = { login: this.user.email, password: this.user.password };
    this.hqService.login(body, {})
    .subscribe(
      (user) => {
        this.disableLogin = false;
        this.session.save(user);
        this.proxySettingsService.loadServers();
        if (!user.account.confirmed) { this.router.navigate(['/confirm/login']); }
        else if (user.account.type === 'pending' || user.account.type === 'invitation') {
          this.router.navigate(['pending']);
        }
        else { this.router.navigate(['/']); }
      },
      (error) => {
        this.disableLogin = false;
        setTimeout(() => { this.passwordInput.nativeElement.select(); });

        this.errors.login = true;
        setTimeout(() => { this.errors.login = false; }, 3000);
      }
    );
  }

  register() {
    this.disableRegister = true;
    let body = { email: this.user.email, password: this.user.password };
    this.hqService.register(body, {})
    .subscribe(
      (data) => {
        this.disableRegister = false;
        this.session.save(data);
        this.proxySettingsService.loadServers();
        this.router.navigate(['/confirm/login']);
      },
      (error) => {
        console.log(error);
        this.disableRegister = false;
        this.errors.register = true;
      }
    );
  }

  goToEmail() {
    this.zone.run(() => {
      this.currentView = 'email';
      this.emailClassList = ['middle'];
      this.loginClassList = ['right'];
      this.registerClassList = ['right'];
    });
  }

  launchTos() {
    chrome.tabs.create({ url: 'https://cypherpunk.com/terms-of-service' });
  }

  launchPP() {
    chrome.tabs.create({ url: 'https://cypherpunk.com/privacy-policy' });
  }
}
