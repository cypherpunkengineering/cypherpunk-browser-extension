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

  // Settings Vars
  otherExt: any;
  accountType: string;
  showTutorial: boolean;
  showLocationList = false;
  cypherpunkEnabled: boolean;

  // display Vars
  currentServer: {};
  serverId: string;
  serverName: string;
  serverFlag: string;
  serverLevel: string;
  connectionStatus = 'Disconnected';
  regions = {}; // used in the view
  servers = [];

  constructor(
    private router: Router,
    private hqService: HqService,
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {
    // get settings vars
    this.showTutorial = !this.settingsService.initialized;
    this.cypherpunkEnabled = this.settingsService.enabled;
    this.regions = this.proxySettingsService.regions;
    this.servers = this.proxySettingsService.serverArr;
    this.serverId = this.settingsService.serverId;
    this.serverName = this.settingsService.serverName;
    this.serverFlag = this.settingsService.serverFlag;
    this.serverLevel = this.settingsService.serverLevel;
    this.accountType = this.settingsService.accountType;
    if (!this.serverId) {
      this.serverName = 'Cypherplay™';
      this.serverFlag = '/assets/icon_cypherplay@2x.png';
    }
    if (this.cypherpunkEnabled) {
      this.connectionStatus = 'Connected';
    }

    // manage other extensions
    this.proxySettingsService.proxyExtObservable.subscribe(
      (ext) => {
        if (ext.name) { this.otherExt = ext; }
        else { this.otherExt = null;  }
      },
      (error) => { this.otherExt = null; }
    );

    // Initialize proxy servers. If latencyList is populated then background
    // script already populated server info
    if (this.proxySettingsService.latencyList && this.proxySettingsService.latencyList.length) {
      this.appendLatency(this.servers);
      console.log('Servers data preloaded by background script');
      this.hqService.fetchUserStatus()
      .subscribe(
        res => {
          this.accountType = res.account.type;
          this.settingsService.saveAccountType(res.account.type);
          this.init();
         },
        err => { this.toggleCypherpunk(false); }
      );
    }
    else { // latencyList isn't populated, populate manually in front end
      console.log('Server data being manually loaded');
      this.proxySettingsService.loadServers()
      .then(res => {
        this.init();
        this.appendLatency(this.servers);
      })
      .catch(err => { this.toggleCypherpunk(false); });
    }
  }

  // set icon for other extension
  ngAfterViewChecked() {
    if (this.extIcon && this.otherExt) {
      this.extIcon.nativeElement.src = this.otherExt.icons[0].url;
    }
  }

  init() {
    // Check if Cypherpunk is on and enable/disable proxy
    // ** So this will restart the proxy everytime the extension is opened...
    chrome.runtime.sendMessage({ action: 'CypherpunkEnabled' });
    if (this.cypherpunkEnabled) { this.proxySettingsService.enableProxy(); }
    else { this.proxySettingsService.disableProxy(); }
  }

  // used in the proxy warning view
  openSettingsPage() {
    let url = 'chrome://settings';
    chrome.tabs.create({ url: url });
  }

  tutorialVisible(visible: boolean) { this.showTutorial = visible; }

  toggleLocationList(show: boolean) { this.showLocationList = show; }

  toggleCypherpunk(enabled: boolean) {
    this.cypherpunkEnabled = enabled;
    this.settingsService.saveCypherpunkEnabled(enabled);
    chrome.runtime.sendMessage({ action: 'CypherpunkEnabled' });

    if (enabled) {
      this.connectionStatus = 'Connected';
      this.proxySettingsService.enableProxy();
    }
    else {
      this.connectionStatus = 'Disconnected';
      this.proxySettingsService.disableProxy();
    }
  }

  appendLatency(servers) {
    let latencyList = this.settingsService.latencyList;
    this.servers.forEach((server) => {
      latencyList.map((latencyServer) => {
        if (latencyServer.id === server.id) {
          server.latency = latencyServer.latency;
        }
      });
    });
  }

  parseServerLevel(server) {
    if (!server.httpDefault.length || !server.enabled) { return 'UNAVAILABLE'; }
    if (server.level === 'developer') { return 'DEV'; }
    if (server.level === 'premium') { return 'PREMIUM'; }
    else { return; }
  }

  disabledServer(server) {
    if (server.level === 'premium' && this.accountType === 'free') { return true; }
    else if (!server.enabled) { return true; }
    else if (!server.httpDefault.length) { return true; }
    else { return false; }
  }

  setServerDetails(server) {
    if (server.name === 'cypherplay' && this.serverName === 'Cypherplay™' && this.cypherpunkEnabled) { return; }
    else if (server.name === 'cypherplay') { /** do nothing **/ }
    else if (this.disabledServer(server)) { return; }
    else if ((server.id === this.serverId) && this.cypherpunkEnabled) { return; }

    // view related variables
    this.cypherpunkEnabled = true;
    this.showLocationList = false;
    this.connectionStatus = 'Connected';
    if (server.name === 'cypherplay') {
      this.serverId = '';
      this.serverLevel = '';
      this.serverName = 'Cypherplay™';
      this.serverFlag = '/assets/icon_cypherplay@2x.png';
    }
    else {
      this.serverId = server.id;
      this.serverName = server.name;
      this.serverLevel = server.level;
      this.serverFlag = `/assets/flags/24/${server.country}.png`;
    }

    // proxy related variables
    this.settingsService.saveCypherpunkEnabled(true);
    this.settingsService.saveServerId(this.serverId);
    this.settingsService.saveServerName(this.serverName);
    this.settingsService.saveServerFlag(this.serverFlag);
    this.settingsService.saveServerLevel(this.serverLevel);
    chrome.runtime.sendMessage({ action: 'CypherpunkEnabled' });
    this.proxySettingsService.enableProxy();
  }
}
