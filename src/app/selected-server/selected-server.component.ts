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
  browserObj: any = chrome ? chrome : chrome;

  title = 'Selected Server';
  domain;
  premiumAccount = this.proxySettingsService.premiumProxyAccount;
  serverArr = this.proxySettingsService.serverArr;
  selectedServerId;
  regions = this.proxySettingsService.regions;

  selectedServerSettings = this.settingsService.selectedServerSettings();
  routing = this.selectedServerSettings.routing;
  routingType = 'SELECTED';

  constructor(
    private zone: NgZone,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {

    let callback = (tabs) => {
      let curTab = tabs[0];
      let url = curTab.url
      let match = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/);
      this.domain = match ? match[1] : null;

      let curSmartRoute = this.routing[this.domain];
      if (curSmartRoute) {
        this.zone.run(() => {
          this.selectedServerId = curSmartRoute.serverId;
        });
      }
    };
    if (chrome) { // Chrome
      this.browserObj.tabs.query({currentWindow: true, active: true}, callback);
    }
    else { // FF
      this.browserObj.tabs.query({currentWindow: true, active: true})
      .then(callback);
    }
  }

  selectProxy(server) {
    console.log(server);
    if (server.level === 'premium' && !this.premiumAccount) { return; }
    else if (!server.enabled) { return; }
    else if (!server.httpDefault.length) { return; }
    else {
      this.selectedServerId = server.id;
       this.routing[this.domain] = {
         type: this.routingType,
         serverId: server.id
       }
      this.settingsService.saveRouting(this.routing);
      this.proxySettingsService.enableProxy();
    }

  }
}

