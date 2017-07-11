import { Router } from '@angular/router';
import { HqService } from '../hq.service';
import { SettingsService } from '../settings.service';
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
    private settingsService: SettingsService
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
        if (user.account.confirmed) { this.router.navigate(['/']); }
        else { this.router.navigate(['/confirm', this.user.email]); }
      },
      (error) => {
        console.log(error);
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
        this.router.navigate(['/confirm', this.user.email]);
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
