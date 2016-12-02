import { Component, Input, Output } from '@angular/core';
import { ProxySettingsService } from '../../../proxy-settings.service';
import { SettingsService } from '../../../settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './specific-server.component.html'
})
export class SpecificServerComponent {
  title = 'Use specific server';
  serverObj;
  premiumAccount;
  serverKeys;
  serverArr = [];
  selectedServerId = this.settingsService.defaultRoutingSettings().selected;

  regions = {
    'NA': 'NORTH AMERICA',
    'SA': 'CENTRAL & SOUTH AMERICA',
    'OP': 'OCEANIA & PACIFIC',
    'EU': 'EUROPE',
    'AS': 'ASIA & INDIA'
  };

  constructor(
    private proxySettingsService: ProxySettingsService,
    private settingsService: SettingsService
  ) {
    this.premiumAccount = this.proxySettingsService.isPremiumProxyAccount();
    this.serverObj = this.proxySettingsService.getServerList();
    this.serverKeys = Object.keys(this.serverObj);
    this.serverKeys.forEach((key: any) => { this.serverArr.push(this.serverObj[key]); });
    // Sort By Region, Country, Name
    this.serverArr.sort(function(a,b) {
      let regionOrder = { 'NA': 1, 'SA': 2, 'OP': 3, 'EU': 4, 'AS': 5 };
      if (regionOrder[a.region] < regionOrder[b.region]) return -1;
      if (regionOrder[a.region] > regionOrder[b.region]) return 1;
      if (a.country < b.country) return -1;
      if (a.country > b.country) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  }

  selectProxy(server) {
    if (server.level === 'premium' && !this.premiumAccount) { return; }
    else {
      this.selectedServerId = server.id;
      this.settingsService.saveRoutingInfo("SPECIFIC", server.id);
    }
  }
}

