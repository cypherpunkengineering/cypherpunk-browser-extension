import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-settings-controller',
  templateUrl: './settings-controller.component.html',
  styleUrls: ['./settings-controller.component.scss']
})
export class SettingsControllerComponent {
  @ViewChild('settings') settings;
  currentView = 'app-settings';

  constructor() {}

  updateWebRtc(type: string) {
    this.settings.updateWebRtc(type);
  }

  updateUserAgent(type: string) {
    this.settings.updateUserAgent(type)
  }

  changeView(viewName: string) {
    this.currentView = viewName;
  }
}
