import { Router } from '@angular/router';
import { HqService } from '../hq.service';
import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';
import { Component, ViewChild, style, animate, transition, state, trigger, ElementRef, AfterViewChecked } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  host: { '[@routeAnimation]': 'true' },
  animations: [
    trigger('routeAnimation', [
      state('*',  style({transform: 'translateX(0)'})),
      transition('* => void',
        animate('0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)', style({transform: 'translateX(0)'}))
      )
    ])
  ]
})
export class IndexComponent implements AfterViewChecked {
  @ViewChild('extIcon') extIcon: ElementRef;
  // Misc Vars
  validProtocol = true;

  // Settings Vars
  showTutorial: boolean;
  cypherpunkEnabled: boolean;

  // Proxy Connection Display Vars
  otherExt: any;
  domain: string;
  faviconUrl: string;
  actualIP: string;
  actualCountry: string;
  actualCountryFlag: string;
  selectedRouteOpt: string;
  selectedRouteServerName: string;
  selectedRouteServerFlag: string;
  starServerName: string;
  starServerFlag: string;

  constructor(
    private router: Router,
    private hqService: HqService,
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {
    // get settings vars
    this.cypherpunkEnabled = this.settingsService.enabled;
    this.showTutorial = !this.settingsService.initialized;

    // manage other extensions
    this.proxySettingsService.proxyExtObservable.subscribe(
      (ext) => {
        if (ext.name) { this.otherExt = ext; }
        else { this.otherExt = null;  }
      },
      (error) => { this.otherExt = null; }
    );

    // set visible strings
    this.domain = 'Loading...';
    this.selectedRouteOpt = 'Loading...';
    this.selectedRouteServerName = 'Loading...';
    let starServer = this.proxySettingsService.getStarServer();
    if (starServer) {
      this.starServerName = starServer.name;
      this.starServerFlag =  '/assets/flags/48/' + starServer.country + '.png';
    }
    else {
      this.starServerName = 'Empty';
      this.starServerFlag =  '';
    }

    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let curTab = tabs[0];
      let url = curTab.url;

      let match = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/);
      this.domain = match ? match[1] : null;

      let protocol = url ? url.split('://')[0] : null;
      this.validProtocol = protocol === 'http' || protocol === 'https';

      if (this.domain && this.validProtocol) {
        // Load fav icon
        // not sure if this is actually used
        if (curTab.favIconUrl && curTab.favIconUrl !== '' && curTab.favIconUrl.indexOf('chrome://favicon/') === -1) {
          this.faviconUrl = curTab.favIconUrl;
        }
      }
    });

    // Initialize proxy servers. If latencyList is populated then background
    // script already populated server info
    if (this.proxySettingsService.latencyList && this.proxySettingsService.latencyList.length) {
      console.log('Servers data preloaded by background script');
      this.hqService.fetchUserStatus()
      .subscribe(
        res => {
          this.settingsService.saveAccountType(res.account.type);
          this.init();
         },
        err => { this.toggleCypherpunk(false); }
      );
    }
    else { // latencyList isn't populated, populate manually in front end
      console.log('Server data being manually loaded');
      this.proxySettingsService.loadServers()
      .then(res => { this.init(); })
      .catch(err => { this.toggleCypherpunk(false); });
    }
  }

  ngAfterViewChecked() {
    if (this.extIcon && this.otherExt) {
      this.extIcon.nativeElement.src = this.otherExt.icons[0].url;
    }
  }

  init() {
    // Check if Cypherpunk is on and enable/disable proxy
    if (this.cypherpunkEnabled) { this.proxySettingsService.enableProxy(); }
    else { this.proxySettingsService.disableProxy(); }

    // Get user's actual location
    this.hqService.findNetworkStatus().subscribe(res => {
      this.actualIP = res.ip;
      this.actualCountry = this.proxySettingsService.countries[res.country];
      this.actualCountryFlag = '/assets/flags/svg/flag-' + res.country + '.svg';
    });

    // If the user is on a tab with a valid domain/protocol. Select the user's stored
    // routing settings in the UI, for display purposes.
    if (this.domain && this.validProtocol) { this.selectedRoutingInit(); }
    // Not on a valid website, apply no proxy
    else {
      this.selectedRouteOpt = 'NONE';
      this.applyNoProxy();
    }
  };

  openSettingsPage() {
    let url = 'chrome://settings';
    chrome.tabs.create({ url: url });
  }

  tutorialVisible(visible: boolean) { this.showTutorial = visible; }

  toggleCypherpunk(enabled: boolean) {
    this.cypherpunkEnabled = enabled;
    this.settingsService.saveCypherpunkEnabled(enabled);
    chrome.runtime.sendMessage({ action: 'CypherpunkEnabled' });

    if (enabled) { this.proxySettingsService.enableProxy(); }
    else { this.proxySettingsService.disableProxy(); }
  }

  selectedRouteType() {
    if (this.selectedRouteOpt === 'Loading...') { return this.selectedRouteOpt; }
    let selectedRouteOpts = {
      smart: 'CypherPlay',
      fastest: 'Fastest',
      fastestuk: 'Fastest UK',
      fastestus: 'Fastest US',
      selected: 'Selected Server',
      star: 'Starred Server',
      none: 'No Proxy'
    };

    return selectedRouteOpts[this.selectedRouteOpt.toLowerCase()];
  }

  /* Selects routing type, when user selects a type via the UI */
  selectRouteType(type: string) {
    if (type === 'SELECTED') { return this.router.navigate(['/selected-server']); }
    if (type === 'STAR' && !this.starServerFlag) { return; }

    // create proxy binding from this domain to proxy type
    switch (type) {
      case 'SMART':
      this.applyCyperplayProxy();
      break;
      case 'FASTEST':
      this.applyFastestProxy();
      break;
      case 'FASTESTUK':
      this.applyFastestUKProxy();
      break;
      case 'FASTESTUS':
      this.applyFastestUSProxy();
      break;
      case 'STAR':
      if (this.starServerFlag) { this.applyStarProxy(); }
      break;
      default:
      this.applyNoProxy();
    }

    console.log('Applying Selected Routing Type: ' + type);
    this.selectedRouteOpt = type;
    this.settingsService.saveRoutingInfo(type, null);
    this.proxySettingsService.enableProxy(); // process proxy binding
  }

  /* Looks at stored settings and preselects correct routing type in the UI */
  selectedRoutingInit() {
    // Check if override for domain exists, apply override settings if it does
    let type = this.settingsService.defaultRoutingType;
    let serverId = this.settingsService.defaultRoutingServer;

    switch (type) {
      case 'SMART':
        this.applyCyperplayProxy();
        break;
      case 'FASTEST':
        this.applyFastestProxy();
        break;
      case 'FASTESTUK':
        this.applyFastestUKProxy();
        break;
      case 'FASTESTUS':
        this.applyFastestUSProxy();
        break;
      case 'SELECTED':
        this.applySelectedProxy(serverId);
        break;
      case 'STAR':
        if (this.starServerFlag) { this.applyStarProxy(); }
        else { this.applyNoProxy(); }
        break;
      default:
        this.applyNoProxy();
    }

    this.selectedRouteOpt = type;
    if (type === 'STAR' && !this.starServerFlag) {
      this.selectedRouteOpt = 'NONE';
      this.settingsService.saveRoutingInfo('NONE', null);
      this.proxySettingsService.enableProxy(); // process proxy binding
    }
  }

  applyCyperplayProxy() {
    this.selectedRouteServerFlag =  '/assets/index-key.png';
    let fastestServer = this.proxySettingsService.getFastestServer();
    if (fastestServer) { this.selectedRouteServerName = fastestServer.name; }
    else { this.selectedRouteServerName = 'Cypherplay Server'; }
  }

  applyFastestProxy() {
    let fastestServer = this.proxySettingsService.getFastestServer();
    if (fastestServer) {
      this.selectedRouteServerName = fastestServer.name;
      this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + fastestServer.country + '.svg';
    }
  }

  applyFastestUSProxy() {
    let usServer = this.proxySettingsService.getFastestUSServer();
    if (usServer) {
      this.selectedRouteServerName = usServer.name;
      this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + usServer.country + '.svg';
    }
  }

  applyFastestUKProxy() {
    let ukServer = this.proxySettingsService.getFastestUKServer();
    if (ukServer) {
      this.selectedRouteServerName = ukServer.name;
      this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + ukServer.country + '.svg';
    }
  }

  applyStarProxy() {
    let starServer = this.proxySettingsService.getStarServer();
    if (starServer) {
      this.selectedRouteServerName = starServer.name;
      this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + starServer.country + '.svg';
      this.starServerName = starServer.name;
      this.starServerFlag =  '/assets/flags/48/' + starServer.country + '.png';
    }
    /* blank state */
    else {
      this.starServerName = 'Empty';
      this.starServerFlag = '';
    }
  }

  applyNoProxy() {
    this.selectedRouteServerName = 'Unprotected';
    this.selectedRouteServerFlag = undefined;
  }

  applySelectedProxy(serverId) {
    if (!serverId) { return; }
    let server = this.proxySettingsService.servers[serverId];
    this.selectedRouteServerName = server.name;
    this.selectedRouteServerFlag =  '/assets/flags/svg/flag-' + server.country + '.svg';
  }
}
