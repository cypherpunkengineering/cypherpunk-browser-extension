import { Router } from '@angular/router';
import { HqService } from '../hq.service';
import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  showAccount = false;
  showSettings = false;

  constructor(
    private router: Router,
    private hqService: HqService,
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {

  }

  openAccount() {
    this.showAccount = true;
  }

  viewConnect() {
    this.showAccount = false;
    this.showSettings = false;
  }

  openSettings() {
    this.showSettings = true;
  }
}
