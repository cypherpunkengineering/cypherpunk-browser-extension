import { SettingsService } from '../settings.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { ProxySettingsService } from '../proxy-settings.service';
import { Component, NgZone, style, animate, transition, state, trigger } from '@angular/core';

@Component({
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
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
export class LocationComponent {
  siteName: string;
  siteUrl: string;
  favIconUrl: string;

  accountType: string;
  regions;
  serverArr = [];
  selectedServerId: string;
  routing;
  defaultRouting;

  constructor(
    private zone: NgZone,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {
    // load default settings
    this.regions = this.proxySettingsService.regions;
    this.serverArr = this.proxySettingsService.serverArr;
    this.routing = this.settingsService.selectedServerSettings().routing;
    this.defaultRouting = this.settingsService.defaultRoutingSettings();
    this.accountType = this.settingsService.proxySettingsService().accountType.toString();

    // load site information
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      // Load site name and url
      this.siteName = tabs[0].title;
      this.siteUrl = tabs[0].url;
      let match = this.siteUrl.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/);
      this.siteUrl = match ? match[1] : null;

      // Load site fav icon
      if (tabs[0].favIconUrl && tabs[0].favIconUrl !== '' && tabs[0].favIconUrl.indexOf('chrome://favicon/') === -1) {
        this.favIconUrl = tabs[0].favIconUrl;
      }

      // start with default
      if (this.defaultRouting.selected) {
        this.selectedServerId = this.defaultRouting.selected.toString();
      }

      // load from localStorage if exists
      let curSmartRoute = this.routing[this.siteUrl];
      if (curSmartRoute) {
        this.zone.run(() => { this.selectedServerId = curSmartRoute.serverId; });
      }
    });
  }

  selectProxy(server) {
    let valid: any = true;
    if (server.level === 'premium' && this.accountType === 'free') { valid = 'premium'; }
    else if (!server.enabled) { valid = 'enabled'; }
    else if (!server.httpDefault.length) { valid = 'http'; }

    if (valid === true) {
      this.selectedServerId = server.id;
      this.routing[this.siteUrl] = { type: 'SELECTED', serverId: server.id };
      this.settingsService.saveRouting(this.routing);
      this.proxySettingsService.enableProxy();
    }
  }
}
