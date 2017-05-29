import { Router } from '@angular/router';
import { HqService } from '../hq.service';
import { SettingsService } from '../settings.service';
import { Component, NgZone, style, animate, transition, state, trigger, ViewChild, ElementRef, Renderer } from '@angular/core';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  host: { '[@routeAnimation]': 'true' },
  animations: [
    trigger('routeAnimation', [
      state('*', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(-100%)' }),
        animate('350ms ease-out')
      ])
    ])
  ]
})
export class LoginComponent {
  @ViewChild('emailInput') emailInput: ElementRef;
  @ViewChild('passwordInput') passwordInput: ElementRef;
  @ViewChild('registerPasswordInput') registerPasswordInput: ElementRef;
  currentView = 'email';
  emailClassList = ['middle'];
  loginClassList = ['right'];
  registerClassList = ['right'];
  error: string;
  user = {
    email: '',
    password: ''
  };

  constructor(
    private zone: NgZone,
    private router: Router,
    private renderer: Renderer,
    private hqService: HqService,
    private settingsService: SettingsService
  ) { this.settingsService.saveTutorialFinished(false); }

  checkEmail() {
    if (!this.user.email) { return; }

    let body = { email: this.user.email };
    this.hqService.identifyEmail(body, {})
    .subscribe(
      (data) => {
        this.currentView = 'login';
        this.emailClassList = ['left'];
        this.loginClassList = ['middle'];

        setTimeout(() => {
          this.renderer.invokeElementMethod(this.passwordInput.nativeElement, 'focus');
        }, 500);
      },
      (error) => {
        if (error.status === 401) {
          this.currentView = 'register';
          this.emailClassList = ['left'];
          this.registerClassList = ['middle'];

          setTimeout(() => {
            this.renderer.invokeElementMethod(this.registerPasswordInput.nativeElement, 'focus');
          }, 500);
        }
        else { return; }
      }
    );
  }

  login() {
    let body = { login: this.user.email, password: this.user.password };
    this.hqService.login(body, {})
    .subscribe(
      (user) => {
        if (user.account.confirmed) { this.router.navigate(['/']); }
        else { this.router.navigate(['/confirm']); }
      },
      (error) => { console.log(error); }
    );
  }

  register() {
    let body = { email: this.user.email, password: this.user.password };
    this.hqService.register(body, {})
    .subscribe(
      (data) => { this.router.navigate(['/confirm', this.user.email]); },
      (error) => { console.log(error); }
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
