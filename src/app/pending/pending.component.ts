import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { SessionService } from '../session.service';

@Component({
  selector: 'pending-view',
  templateUrl: './pending.component.html',
  styleUrls: ['./pending.component.scss']
})
export class PendingComponent {
  user: any;

  constructor(
    private router: Router,
    private session: SessionService
  ) { this.user = session.user; }

  goBack() { this.router.navigate(['login']); }
}
