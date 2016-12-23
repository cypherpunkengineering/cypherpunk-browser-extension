import { Component, Input, Output, style, animate, transition, state, trigger } from '@angular/core';
import { ChangeDetectorRef } from "@angular/core";

@Component({
  selector: 'app-settings-controller',
  templateUrl: './settings-controller.component.html',
  styles: [':host { z-index: 1; width: 100%; height: 100%; display: block; position: absolute; }'],
  host: { '[@routeAnimation]': 'true' },
  animations: [
    trigger('routeAnimation', [
      state('*', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(100%)' }),
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)')
      ]),
      transition('* => void',
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)', style({
          transform: 'translateX(100%)'
        }))
      )
    ]),
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
  currentView = 'app-settings';
  type;
  private changeDetectorRef: ChangeDetectorRef;

  constructor( changeDetectorRef: ChangeDetectorRef ) {
      this.changeDetectorRef = changeDetectorRef;
      this.type = "dynamic";
  }

  changeView(viewName: string) {
    if (viewName === 'app-specific-server' || this.currentView === 'app-specific-server') { this.type = "static" }
    else { this.type = "dynamic"; }
    this.changeDetectorRef.detectChanges();

    this.currentView = viewName;
  }
}