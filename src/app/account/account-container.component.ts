import { Component } from '@angular/core';
import { HqService } from '../hq.service';

@Component({
  selector: 'app-account-main',
  templateUrl: './account-container.component.html',
  styleUrls: ['./account-container.component.scss']
})
export class AccountContainerComponent {
  user = { account: {}, subscription: {} };

  constructor( hqService: HqService ) {
    hqService.fetchUserStatus().subscribe(
      data => { this.user = data; },
      err => { /* do nothing */ }
    );
  }
}
