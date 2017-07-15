import { HqService } from '../hq.service';
import { Component } from '@angular/core';
import { SessionService } from '../session.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'confirm-view',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent {
  user: any;
  state: string;
  resendString = 'Resend Email';

  constructor(
    private router: Router,
    private hqService: HqService,
    private route: ActivatedRoute,
    private session: SessionService
  ) {
    this.state = 'loading';
    this.user = session.user;

    // handle checking on page load
    let fromLogin = this.route.snapshot.params['login'];
    // wait 20 seconds then check
    if (fromLogin) { setTimeout(() => { this.checkConfirmation(); }, 20000); }
    // else check immediately
    else { this.checkConfirmation(); }
  }

  checkConfirmation() {
    this.state = 'loading'
    this.hqService.fetchUserStatus()
    .then((user: any) => {
      // if (user.account.confirmed) { this.router.navigate(['/']); }
      // else { setTimeout(() => { this.state = 'check'; }, 10000); }
      this.state = 'check';
    })
    .catch((err) => { setTimeout(() => { this.state = 'check'; }, 10000); });
  }

  resend() {
    let body = { email: this.user.email };
    this.hqService.resend(body, {})
    .subscribe(
      (data) => {
        console.log(data);
        this.resendString = 'Email Sent!';
      },
      (error) => {
        console.log(error);
        this.resendString = 'Error!';
      }
    );
  }

  goBack() { this.router.navigate(['login']); }
}
