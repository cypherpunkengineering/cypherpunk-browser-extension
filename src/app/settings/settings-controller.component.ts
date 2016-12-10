import { Component, Input, Output } from '@angular/core';
import { Animations } from '../animations';

@Component({
  selector: 'app-settings-controller',
  templateUrl: './settings-controller.component.html',
  styles: [':host { z-index: 1; width: 100%; height: 100%; display: block; position: absolute; }'],
  host: { '[@routeAnimation]': 'true' },
  animations: Animations.slideFromLeft
})
export class SettingsControllerComponent {
  currentView = 'app-settings';

  changeView(viewName: string) {
    this.currentView = viewName;
  }
}
