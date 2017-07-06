import { Component } from '@angular/core';

@Component({
  selector: 'app-settings-controller',
  templateUrl: './settings-controller.component.html',
  styleUrls: ['./settings-controller.component.scss']
})
export class SettingsControllerComponent {
  currentView = 'app-settings';

  constructor() {}

  changeView(viewName: string) {
    this.currentView = viewName;
  }
}
