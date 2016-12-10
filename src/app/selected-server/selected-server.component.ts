import { Component, NgZone } from '@angular/core';
import { ProxySettingsService } from '../proxy-settings.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-selected-server',
  templateUrl: './selected-server.component.html'
})
export class SelectedServerComponent {
  title = 'Selected Server';
  domain;
  premiumAccount = this.proxySettingsService.premiumProxyAccount;
  serverArr = this.proxySettingsService.serverArr;
  selectedServerId;
  regions = this.proxySettingsService.regions;

  selectedServerSettings = this.settingsService.selectedServerSettings();
  smartRouting = this.selectedServerSettings.smartRouting;
  smartRoutingType = 'SELECTED';

  constructor(
    private zone: NgZone,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {

    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let curTab = tabs[0];
      let url = curTab.url
      this.domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

      let curSmartRoute = this.smartRouting[this.domain];
      if (curSmartRoute) {
        this.zone.run(() => {
          this.selectedServerId = curSmartRoute.serverId;
        });
      }
    });

  }

  selectProxy(server) {
    console.log(server);
    if (server.level === 'premium' && !this.premiumAccount) { return; }
    else {
      this.selectedServerId = server.id;
       this.smartRouting[this.domain] = {
         type: this.smartRoutingType,
         serverId: server.id
       }
      this.settingsService.saveSmartRouting(this.smartRouting);
    }

  }
}

