import { Component, Input, Output, style, animate, transition, state, trigger } from '@angular/core';

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
    ])
  ]
})
export class SettingsControllerComponent {
  currentView = 'app-settings';

  changeView(viewName: string) {
    this.currentView = viewName;
  }
}
