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

  overrides: any;
  blockAds = false;
  blockMalware = false;
  hasOverrides = false;

  constructor(
    private zone: NgZone,
    private settingsService: SettingsService,
    private localStorageService: LocalStorageService,
    private proxySettingsService: ProxySettingsService
  ) {
    // load default settings
    this.overrides = this.settingsService.siteOverrides;
    this.blockAds = this.settingsService.privacyFilterAds;
    this.blockMalware = this.settingsService.privacyFilterMalware;

    // load site information
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      // Load site name and url
      this.siteName = tabs[0].title;
      this.siteUrl = tabs[0].url;
      let match = this.siteUrl.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/);
      this.siteUrl = match ? match[1] : null;

      let protocol = tabs[0].url ? tabs[0].url.split('://')[0] : null;
      let validProtocol = protocol === 'http' || protocol === 'https';

      // Load site fav icon
      if (tabs[0].favIconUrl && tabs[0].favIconUrl !== '' && tabs[0].favIconUrl.indexOf('chrome://favicon/') === -1 && validProtocol) {
        this.favIconUrl = tabs[0].favIconUrl;
      }

      // load overrides from settings
      let localOverrides = this.overrides[this.siteUrl];
      if (localOverrides && validProtocol) {
        this.hasOverrides = true;

        // set block ads
        if (localOverrides.blockAds !== undefined) { this.blockAds = localOverrides.blockAds; }

        // set block malware
        if (localOverrides.blockMalware !== undefined) {
          this.blockMalware = localOverrides.blockMalware;
        }
      }
    });
  }

  toggleBlockAds(enabled: boolean) {
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.blockAds = enabled; }
    else { currentEntry = { blockAds: enabled }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  toggleBlockMalware(enabled: boolean) {
    let currentEntry = this.overrides[this.siteUrl];
    if (currentEntry) { currentEntry.blockMalware = enabled; }
    else { currentEntry = { blockMalware: enabled }; }
    this.overrides[this.siteUrl] = currentEntry;
    this.settingsService.saveSiteOverrides(this.overrides);
    this.proxySettingsService.enableProxy();
    this.hasOverrides = true;
  }

  resetSiteOverrides() {
    if (!this.hasOverrides) { return; }
    this.blockAds = this.settingsService.privacyFilterAds;
    this.blockMalware = this.settingsService.privacyFilterMalware;
    this.hasOverrides = false;

    // reset privacy whitelist
    delete this.overrides[this.siteUrl];
    this.settingsService.saveSiteOverrides(this.overrides);
    chrome.runtime.sendMessage({ action: 'updatePrivacyFilter' });
    this.proxySettingsService.enableProxy();
  }
}
