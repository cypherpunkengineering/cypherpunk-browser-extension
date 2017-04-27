import { Component, style, animate, transition, trigger, Output, EventEmitter } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-settings-controller',
  templateUrl: './settings-controller.component.html',
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
        style({transform: 'translateX(100%)' }),
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)')
      ]),
      transition('dynamic => void',
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)', style({
          transform: 'translateX(100%)'
        }))
      )
    ])
  ]
})
export class SettingsControllerComponent {
  @Output() viewConnect = new EventEmitter();
  private changeDetectorRef: ChangeDetectorRef;
  currentView = 'app-settings';
  type;

  constructor( changeDetectorRef: ChangeDetectorRef ) {
    this.type = 'dynamic';
    this.changeDetectorRef = changeDetectorRef;
  }

  changeView(viewName: string) {
    if (viewName === 'home') {
      this.changeDetectorRef.detectChanges();
      this.currentView = 'app-settings';
      return this.viewConnect.emit();
    }
    this.changeDetectorRef.detectChanges();
    this.currentView = viewName;
  }
}
