import { Component, Output, EventEmitter } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { HqService } from '../hq.service';

@Component({
  selector: 'app-account-main',
  templateUrl: './account-container.component.html',
  styleUrls: ['./account-container.component.scss']
})
export class AccountContainerComponent {
  @Output() viewConnect = new EventEmitter();

  private changeDetectorRef: ChangeDetectorRef;
  currentView = 'app-account';
  user = { account: {}, subscription: {} };
  type = 'dynamic';

  constructor( changeDetectorRef: ChangeDetectorRef, hqService: HqService ) {
    this.changeDetectorRef = changeDetectorRef;
    hqService.fetchUserStatus().subscribe(
      data => { this.user = data; },
      err => { /* do nothing */ }
    );
  }

  changeView(viewName: string) {
    if (viewName === 'home') {
      this.changeDetectorRef.detectChanges();
      this.currentView = 'app-account';
      return this.viewConnect.emit();
    }
    this.changeDetectorRef.detectChanges();
    this.currentView = viewName;
  }
}
