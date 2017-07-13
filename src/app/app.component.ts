import './rxjs-operators';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { SessionService } from './session.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private router: Router,
    private session: SessionService
  ) {
    // handle routing user to /confirm page
    session.getObservableUser().subscribe((user) => {
      let confirmed = user.account.confirmed;
      let accountPending = user.account.type === 'pending';
      let accountInvitation = user.account.type === 'invitation';
      let email = user.account.email;

      if (!confirmed && email) { this.router.navigate(['/confirm', email]); }
      else if (accountPending || accountInvitation) { this.router.navigate(['/pending']); }
    });
  }

}
