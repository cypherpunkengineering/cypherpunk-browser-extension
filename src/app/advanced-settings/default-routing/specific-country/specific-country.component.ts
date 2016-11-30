import { Component } from '@angular/core';
import { ProxySettingsService } from '../../../proxy-settings.service';
import { LocalStorageService } from 'angular-2-local-storage';

@Component({
  selector: 'app-root',
  templateUrl: './specific-country.component.html'
})
export class SpecificCountryComponent {
  title = 'Use a specific country';
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

  constructor(
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService,
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
    this.selectedServerId = this.serverArr[0].id;
  }

  selectProxy(server) {
    if (server.level === 'premium' && !this.premiumAccount) { return; }
    else { this.selectedServerId = server.id; }
  }
}

