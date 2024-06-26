import { Router } from '@angular/router';
import { HqService } from '../hq.service';
import { SessionService } from '../session.service';
import { SettingsService } from '../settings.service';
import { ProxySettingsService } from '../proxy-settings.service';
import { Component, ViewChild, ElementRef, AfterViewChecked, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-connect',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements AfterViewChecked {
  @ViewChild('extIcon') extIcon: ElementRef;
  @Output() openAccount: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() openSettings: EventEmitter<boolean> = new EventEmitter<boolean>();

  // Settings Vars
  user: any;
  otherExt: any;
  showTutorial: boolean;
  showLocationList = false;
  cypherpunkEnabled: boolean;

  // display Vars
  serverId: string;
  serverName: string;
  serverFlag: string;
  serverLevel: string;
  connectionStatus = 'Disconnected';
  regions = {}; // used in the view
  servers = [];

  // Map Vars
  pi = Math.PI;
  halfPi = this.pi / 2;
  epsilon = Number.EPSILON;
  currentServer;
  hoverServer;
  cypherplayMarker = {
    scale: 0.5,
    mapX: 939.232,
    mapY: 530.757
  };
  cypherplaySelected: boolean;
  cypherplayHovered: boolean;

  constructor(
    private router: Router,
    private hqService: HqService,
    private session: SessionService,
    private settingsService: SettingsService,
    private proxySettingsService: ProxySettingsService
  ) {
    // get settings vars
    this.user = this.session.user;
    this.showTutorial = false; // !this.settingsService.initialized;
    this.cypherpunkEnabled = this.settingsService.enabled;
    this.regions = this.proxySettingsService.regions;
    this.servers = this.proxySettingsService.serverArr;
    this.serverId = this.settingsService.serverId;
    this.serverName = this.settingsService.serverName;
    this.serverFlag = this.settingsService.serverFlag;
    this.serverLevel = this.settingsService.serverLevel;

    // Double check connection status display
    if (this.cypherpunkEnabled) { this.connectionStatus = 'Connected'; }
    else { this.connectionStatus = 'Disconnected'; }

    // User Observable
    this.session.getObservableUser().subscribe((user) => {
      // Check for expired accounts
      if (!user.subscription.active) {
        this.toggleCypherpunk(false);
        this.connectionStatus = 'Account Expired';
      }
    });

    // Servers Observable
    this.proxySettingsService.getServersObservable().subscribe(
      (servers) => {
        console.log('servers obserable fired in index');
        this.servers = this.proxySettingsService.serverArr;
        this.appendLatency(this.servers);
      }
    );

    // Extensions Observable
    this.proxySettingsService.proxyExtObservable.subscribe(
      (ext) => {
        if (ext.name) { this.otherExt = ext; }
        else { this.otherExt = null;  }
      },
      error => { this.otherExt = null; }
    );

    // Check for CypherPlay set as default
    if (!this.serverId) {
      this.serverName = 'CypherPlay™';
      this.serverFlag = '/assets/icon_cypherplay@2x.png';
      this.cypherplaySelected = true;
    }

    // generate XY points for all servers
    this.translateLocations(this.servers);
    // Set current Server for mapping
    this.servers.map((server) => {
      if (server.id === this.serverId) { this.currentServer = server; }
    });

    // if current server not set, use cypherplay
    if (!this.currentServer) { this.currentServer = this.cypherplayMarker; }
  }

  // set icon for other extension
  ngAfterViewChecked() {
    if (this.extIcon && this.otherExt) {
      this.extIcon.nativeElement.src = this.otherExt.icons[0].url;
    }
  }

  // used in the proxy warning view
  openSettingsPage() {
    let url = 'chrome://settings';
    chrome.tabs.create({ url: url });
  }

  vanDerGrinten3Raw(lambda, phi) {
    if (Math.abs(phi) < this.epsilon) { return [lambda, 0]; }

    let sinTheta = phi / this.halfPi;
    let theta = Math.asin(sinTheta);

    if (Math.abs(lambda) < this.epsilon || Math.abs(Math.abs(phi) - this.halfPi) < this.epsilon) {
      return [0, this.pi * Math.tan(theta / 2)];
    }

    let A = (this.pi / lambda - lambda / this.pi) / 2;
    let y1 = sinTheta / (1 + Math.cos(theta));

    return [
      this.pi * (Math.sign(lambda) * Math.sqrt(A * A + 1 - y1 * y1) - A),
      this.pi * y1
    ];
  }

  transformToXY(lat, long) {
    let coords = this.vanDerGrinten3Raw((long - 11) * this.pi / 180, -1 * lat * this.pi / 180);
    coords[0] = (coords[0] * 150 + (920 / 2)) * (2000 / 920);
    coords[1] = (coords[1] * 150 + (500 / 2 + 500 * 0.15)) * (2000 / 920);
    return coords;
  }

  translateLocations(servers) {
    servers.forEach((server) => {
      if (!server.lat || !server.lon) { return; }
      let [ x, y ] = this.transformToXY(server.lat, server.lon);
      server.mapX = x;
      server.mapY = y;
      server.scale = server.scale || 1;
    });
    return servers;
  }

  generateMapStyle() {
    if (this.showLocationList && this.hoverServer) {
      return { 'transform': `scale(${this.hoverServer.scale}) translate(-${this.hoverServer.mapX}px, -${this.hoverServer.mapY}px)`};
    }
    else if (!this.showLocationList && this.currentServer) {
      return { 'transform': `scale(${this.currentServer.scale}) translate(-${this.currentServer.mapX}px, -${this.currentServer.mapY}px)`};
    }
    else {
      return { 'transform': `scale(${this.cypherplayMarker.scale}) translate(-${this.cypherplayMarker.mapX}px, -${this.cypherplayMarker.mapY}px)`};
    }
  }

  setHoverServer(server, cypherplay?) {
    this.hoverServer = server;
    if (cypherplay) { this.cypherplayHovered = true; }
    else { this.cypherplayHovered = false; }
  }

  unsetHoverServer(server) { this.cypherplayHovered = false; }

  showMarker() {
    if (this.showLocationList) { return this.cypherplayHovered; }
    else { return this.cypherplaySelected; }
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
    if (server.level === 'premium' && this.user.account.type === 'free') { return true; }
    else if (!server.enabled) { return true; }
    else if (!server.httpDefault.length) { return true; }
    else { return false; }
  }

  setServerDetails(server) {
    if (server.name === 'cypherplay' && this.serverName === 'CypherPlay™' && this.cypherpunkEnabled) { return; }
    else if (server.name === 'cypherplay') { /** do nothing **/ }
    else if (this.disabledServer(server)) { return; }
    else if ((server.id === this.serverId) && this.cypherpunkEnabled) { return; }

    // view related variables
    this.showLocationList = false;
    if (server.name === 'cypherplay') {
      this.serverId = '';
      this.serverLevel = '';
      this.serverName = 'CypherPlay™';
      this.serverFlag = '/assets/icon_cypherplay@2x.png';
      this.currentServer = this.cypherplayMarker;
      this.hoverServer = this.cypherplayMarker;
      this.cypherplaySelected = true;
    }
    else {
      this.serverId = server.id;
      this.serverName = server.name;
      this.serverLevel = server.level;
      this.serverFlag = `/assets/flags/24/${server.country}.png`;
      this.currentServer = server;
      this.hoverServer = server;
      this.cypherplaySelected = false;
    }

    // proxy related variables
    this.settingsService.saveServerId(this.serverId);
    this.settingsService.saveServerName(this.serverName);
    this.settingsService.saveServerFlag(this.serverFlag);
    this.settingsService.saveServerLevel(this.serverLevel);
    this.toggleCypherpunk(true);
  }

  accountEmit() {
    this.openAccount.emit(true);
  }

  settingsEmit() {
    this.openSettings.emit(true);
  }
}
