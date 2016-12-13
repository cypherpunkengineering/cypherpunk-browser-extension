import { Component, NgZone, style, animate, transition, state, trigger } from '@angular/core';
import { ProxySettingsService } from '../proxy-settings.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-selected-server',
  templateUrl: './selected-server.component.html',
  styles: [':host { z-index: 2; width: 100%; height: 100%; display: block; position: absolute; }'],
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

