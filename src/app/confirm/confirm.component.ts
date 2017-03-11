import { Router, ActivatedRoute } from '@angular/router';
import { HqService } from '../hq.service';
import { Component, style, animate, transition, state, trigger } from '@angular/core';

@Component({
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
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
export class ConfirmComponent {

  constructor(
    private router: Router,
    private hqService: HqService,
    private route: ActivatedRoute
  ) {}

  resend() {
    let email = this.route.snapshot.params['email'];
    let body = { email: email };
    this.hqService.resend(body, {})
    .subscribe(
      (data) => { console.log(data); },
      (error) => { console.log(error); }
    );
  }
}