import { Component, style, animate, transition, trigger, Output, EventEmitter } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { HqService } from '../hq.service';

@Component({
  selector: 'app-account-main',
  templateUrl: './account-container.component.html',
  animations: [
    trigger('slideIn', [
      transition('void => static', [
        style({transform: 'translateX(0)' }),
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)', style({transform: 'translateX(0)'}))
      ]),
      transition('static => void',
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)', style({transform: 'translateX(0)'}))
      ),
      transition('void => dynamic', [
        style({transform: 'translateX(-100%)' }),
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)')
      ]),
      transition('dynamic => void',
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)', style({
          transform: 'translateX(-100%)'
        }))
      )
    ])
  ]
})
export class AccountContainerComponent {
  @Output() viewConnect = new EventEmitter();

  private changeDetectorRef: ChangeDetectorRef;
  currentView = 'app-account';
  user = { account: {} };
  type = 'dynamic';

  constructor( changeDetectorRef: ChangeDetectorRef, hqService: HqService ) {
    this.changeDetectorRef = changeDetectorRef;
    hqService.fetchUserStatus().subscribe(data => { this.user = data; });
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
