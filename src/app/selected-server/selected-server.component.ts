import { Component, NgZone } from '@angular/core';
import { ProxySettingsService } from '../proxy-settings.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './selected-server.component.html'
})
export class SelectedServerComponent {
  title = 'Selected Server';
  domain;
  serverObj;
  premiumAccount;
  serverKeys;
  serverArr = [];
  selectedServerId;
  regions = {
    'NA': 'NORTH AMERICA',
    'SA': 'CENTRAL & SOUTH AMERICA',
    'EU': 'EUROPE',
    'AS': 'ASIA & INDIA'
  };

  selectedServerSettings = this.settingsService.selectedServerSettings();
  smartRouting = this.selectedServerSettings.smartRouting;
  smartRoutingType = 'SELECTED';

  constructor(
    private zone: NgZone,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {

    this.premiumAccount = this.proxySettingsService.isPremiumProxyAccount();
    this.serverObj = this.proxySettingsService.getServerList();
    this.serverKeys = Object.keys(this.serverObj);
    this.serverKeys.forEach((key: any) => { this.serverArr.push(this.serverObj[key]); });
    // Sort By Region, Country, Name
    this.serverArr.sort(function(a,b) {
      let regionOrder = { 'NA': 1, 'SA': 2, 'EU': 3, 'AS': 4 };
      if (regionOrder[a.region] < regionOrder[b.region]) return -1;
      if (regionOrder[a.region] > regionOrder[b.region]) return 1;
      if (a.country < b.country) return -1;
      if (a.country > b.country) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

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

