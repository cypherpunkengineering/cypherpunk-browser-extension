import { Router } from '@angular/router';
import { HqService } from '../hq.service';
import { Component, style, animate, transition, state, trigger, ViewChild, ElementRef, AfterViewInit, Renderer } from '@angular/core';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  host: { '[@routeAnimation]': 'true' },
  animations: [
    trigger('routeAnimation', [
      state('*', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(-100%)' }),
        animate('0.5s ease-in')
      ])
    ])
  ]
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('emailInput') emailInput: ElementRef;
  @ViewChild('passwordInput') passwordInput: ElementRef;
  type = 'dynamic';
  currentView = 'email';
  emailClassList = ['middle'];
  loginClassList = ['right'];
  registerClassList = ['right'];
  confirmClassList = ['right'];
  error: string;
  user = {
    email: '',
    password: ''
  };

  constructor(
    private router: Router,
    private hqService: HqService,
    private renderer: Renderer
  ) {}

  ngAfterViewInit() {
    this.renderer.invokeElementMethod(this.emailInput.nativeElement, 'focus');
  }

  checkEmail() {
    if (!this.user.email) { return; }

    let body = { email: this.user.email };
    this.hqService.identifyEmail(body, {})
    .subscribe(
      (data) => {
        this.emailClassList = ['left'];
        this.loginClassList = ['middle'];
      },
      (error) => {
        if (error.status === 401) {
          this.emailClassList = ['left'];
          this.registerClassList = ['middle'];
        }
        else { return; }
      }
    );
  }

  login() {
    let body = { login: this.user.email, password: this.user.password };
    this.hqService.login(body, {})
    .subscribe(
      (data) => { this.router.navigate(['/']); },
      (error) => { console.log(error); }
    );
  }

  register() {

  }

  goToEmail() {
    this.emailClassList = ['middle'];
    this.loginClassList = ['right'];
    this.registerClassList = ['right'];
  }
}
