import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';

class Keys {
  // Account Info
  public static ACCOUNT_TYPE = 'accountType';
  public static PROXY_USERNAME = 'proxy.username';
  public static PROXY_PASSWORD = 'proxy.password';

  // Server settings
  public static SERVER_ID = 'serverId';
  public static SERVER_NAME = 'serverName';
  public static SERVER_FLAG = 'serverFlag';
  public static SERVER_LEVEL = 'serverLevel';
  public static LATENCY_LIST = 'latencyList';
  public static PROXY_SERVERS = 'proxyServers';
  public static PROXY_SERVERS_ARR = 'proxyServersArr';
  public static PREMIUM_ACCOUNT = 'premiumAccount';
  public static PAC_SCRIPT_CONFIG = 'pacScriptConfig';
  public static STARRED_SERVERS = 'starredServers';

  // Index view
  public static ENABLED = 'enabled';
  public static INITIALIZED = 'initialized';

  // Advanced Settings
  public static FORCE_HTTPS = 'settings.forceHttps';
  public static SITE_OVERRIDES = 'settings.siteOverrides';
  public static WEB_RTC_LEAK_PROTECTION = 'settings.webRTCLeakProtection';
  public static FF_WEB_RTC_LEAK_PROTECTION = 'settings.ffWebRTCLeakProtection';

  // Default Routing
  public static ROUTING_TYPE = 'settings.defaultRouting.type';
  public static ROUTING_SELECTED_SERVER = 'settings.defaultRouting.selected';

  // User Agent
  public static USER_AGENT_TYPE = 'settings.userAgent.type';
  public static USER_AGENT_STRING = 'settings.userAgent.string';

  // Privacy Filter
  public static PRIVACY_MODE = 'privacyMode';
  public static PRIVACY_FILTER_ADS = 'settings.privacyFilter.blockAds';
  public static PRIVACY_FILTER_MALWARE = 'settings.privacyFilter.blockMalware';
  public static MICROPHONE_PROTECTION = 'microphoneProtection';
}

class Defaults {
  public static CONFIG = {
    initialized: false,
    enabled: false,
    privacyMode: true,
    latencyList: [],
    proxyServers: {},
    proxyServersArr: [],
    starredServers: [],
    premiumAccount: false,
    accountType: 'free',
    pacScriptConfig: null,
    serverId: '',
    serverName: '',
    serverFlag: '',
    serverLevel: '',
    microphoneProtection: false,
    settings: {
      forceHttps: true,
      siteOverrides: {},
      ffWebRTCLeakProtection: false,
      webRTCLeakProtection: 'DEFAULT',
      defaultRouting: {
        type: 'SMART',
        selected: null
      },
      privacyFilter: {
        blockAds: false,
        blockMalware: false
      },
      userAgent: {
        type: 'DEFAULT',
        string: false
      }
    }
  };

  public static getVal(keyPath) {
    return keyPath.split('.').reduce((o, i) => o[i], Defaults.CONFIG);
  };
}

@Injectable()
export class SettingsService {
  enabled: boolean;
  forceHttp: boolean;
  accountType: string;
  initialized: boolean;
  premiumAccount: boolean;
  latencyList = [];
  proxyServers = {};
  starredServers = [];
  proxyServersArray = [];
  defaultRoutingType: string;
  defaultRoutingServer: string;
  siteOverrides: {};
  privacyMode: boolean;
  privacyFilterAds: boolean;
  privacyFilterMalware: boolean;
  userAgentType: string;
  userAgentString: string;
  ffWebRtcLeakProtection: boolean;
  webRtcLeakProtection: string;
  serverId: string;
  serverName: string;
  serverFlag: string;
  serverLevel: string;
  microphoneProtection: boolean;

  constructor (private localStorageService: LocalStorageService) {
    // Settings haven't been initialized yet, set defaults
    this.enabled = this.defaultSetting(Keys.ENABLED);
    this.initialized = this.defaultSetting(Keys.INITIALIZED);
    this.accountType = this.defaultSetting(Keys.ACCOUNT_TYPE);
    this.latencyList = this.defaultSetting(Keys.LATENCY_LIST);
    this.proxyServers = this.defaultSetting(Keys.PROXY_SERVERS);
    this.starredServers = this.defaultSetting(Keys.STARRED_SERVERS);
    this.proxyServersArray = this.defaultSetting(Keys.PROXY_SERVERS_ARR);
    this.premiumAccount = this.defaultSetting(Keys.PREMIUM_ACCOUNT);
    this.defaultRoutingType = this.defaultSetting(Keys.ROUTING_TYPE);
    this.defaultRoutingServer = this.defaultSetting(Keys.ROUTING_SELECTED_SERVER);
    this.forceHttp = this.defaultSetting(Keys.FORCE_HTTPS);
    this.siteOverrides = this.defaultSetting(Keys.SITE_OVERRIDES);
    this.privacyMode = this.defaultSetting(Keys.PRIVACY_MODE);
    this.privacyFilterAds = this.defaultSetting(Keys.PRIVACY_FILTER_ADS);
    this.privacyFilterMalware = this.defaultSetting(Keys.PRIVACY_FILTER_MALWARE);
    this.userAgentType = this.defaultSetting(Keys.USER_AGENT_TYPE);
    this.userAgentString = this.defaultSetting(Keys.USER_AGENT_STRING);
    this.serverId = this.defaultSetting(Keys.SERVER_ID);
    this.serverName = this.defaultSetting(Keys.SERVER_NAME);
    this.serverFlag = this.defaultSetting(Keys.SERVER_FLAG);
    this.serverLevel = this.defaultSetting(Keys.SERVER_LEVEL);
    this.microphoneProtection = this.defaultSetting(Keys.MICROPHONE_PROTECTION);
    if (this.isFirefox()) {
      this.ffWebRtcLeakProtection = this.defaultSetting(Keys.FF_WEB_RTC_LEAK_PROTECTION);
    }
    else {
      this.webRtcLeakProtection = this.defaultSetting(Keys.WEB_RTC_LEAK_PROTECTION);
    }
  }

  private defaultSetting(key): any {
    let value = this.localStorageService.get(key);
    if (value === null) {
      value = Defaults.getVal(key);
      this.localStorageService.set(key, value);
    }
    return value;
  }

  /* Returns if browser is firefox or not */
  isFirefox(): boolean {
    let isFirefox = false;
    // browser is defined in firefox, but not chrome
    try { isFirefox = browser !== undefined; }
    catch (e) { /* Swallow error for when browser is not defined */ }
    return isFirefox;
  }

  /* Proxy Settings Service */
  proxySettingsService() {
    return {
      latencyList: this.localStorageService.get(Keys.LATENCY_LIST),
      proxyServers: this.localStorageService.get(Keys.PROXY_SERVERS),
      proxyServersArr: this.localStorageService.get(Keys.PROXY_SERVERS_ARR)
    };
  }

  saveAccountType(accountType: string) {
    this.accountType = accountType;
    this.localStorageService.set(Keys.ACCOUNT_TYPE, accountType);
  }

  savePacScriptConfig(config) {
    this.localStorageService.set(Keys.PAC_SCRIPT_CONFIG, config);
  }

  starServer(server) {
    let contains = false;
    this.starredServers.map((starServer) => {
      if (starServer.id === server.id) { contains = true; }
    });

    if (!contains) { this.starredServers.push(server); }
    this.localStorageService.set(Keys.STARRED_SERVERS, this.starredServers);
  }

  unstarServer(server) {
    let serverIndex: number;
    this.starredServers.map((starServer, index) => {
      if (starServer.id === server.id) { serverIndex = index; }
    });

    if (serverIndex > -1) { this.starredServers.splice(serverIndex, 1); }
    this.localStorageService.set(Keys.STARRED_SERVERS, this.starredServers);
  }

  updateServerUsage(serverId) {
    this.starredServers.map((server) => {
      if (server.id === serverId) { server.last_used = new Date().getTime(); }
    });

    this.localStorageService.set(Keys.STARRED_SERVERS, this.starredServers);
  }

  /** Index Settings **/
  saveTutorialFinished(initialized: boolean) {
    this.initialized = initialized;
    this.localStorageService.set(Keys.INITIALIZED, initialized);
  }

  saveProxyCredentials(username: string, password: string) {
    this.localStorageService.set(Keys.PROXY_USERNAME, username);
    this.localStorageService.set(Keys.PROXY_PASSWORD, password);
  }

  saveLatencyList(arr) {
    this.latencyList = arr;
    this.localStorageService.set(Keys.LATENCY_LIST, arr);
  }

  saveProxyServers(servers: Object, serverArr) {
    this.proxyServers = servers;
    this.proxyServersArray = serverArr;
    this.localStorageService.set(Keys.PROXY_SERVERS, servers);
    this.localStorageService.set(Keys.PROXY_SERVERS_ARR, serverArr);
  }

  saveCypherpunkEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.localStorageService.set(Keys.ENABLED, enabled);
  }

  /** Advanced Settings **/

  saveForceHttps(enabled: boolean) {
    this.forceHttp = enabled;
    this.localStorageService.set(Keys.FORCE_HTTPS, enabled);
  }

  /** Advanced Settings > WebRTC Leak Prevention **/

  saveFFWebRtcLeakProtection(enabled: boolean) {
    this.ffWebRtcLeakProtection = enabled;
    this.localStorageService.set(Keys.FF_WEB_RTC_LEAK_PROTECTION, enabled);
  }

  saveWebRtcLeakProtection(type: string) {
    this.webRtcLeakProtection = type;
    this.localStorageService.set(Keys.WEB_RTC_LEAK_PROTECTION, type);
  }

  /** Advanced Settings > Privacy Filter **/

  savePrivacyMode(privacyMode: boolean) {
    this.privacyMode = privacyMode;
    this.localStorageService.set(Keys.PRIVACY_MODE, privacyMode);
  }

  savePrivacyFilterAds(enabled: boolean) {
    this.privacyFilterAds = enabled;
    this.localStorageService.set(Keys.PRIVACY_FILTER_ADS, enabled);
  }

  savePrivacyFilterMalware(enabled: boolean) {
    this.privacyFilterMalware = enabled;
    this.localStorageService.set(Keys.PRIVACY_FILTER_MALWARE, enabled);
  }

  saveMicrophoneProtection(enabled: boolean) {
    this.microphoneProtection = enabled;
    this.localStorageService.set(Keys.MICROPHONE_PROTECTION, enabled);
  }


  /** Advanced Settings > User Agent **/

  saveUserAgent(type: string, agentString: string) {
    this.userAgentType = type;
    this.userAgentString = agentString;
    this.localStorageService.set(Keys.USER_AGENT_TYPE, type);
    this.localStorageService.set(Keys.USER_AGENT_STRING, agentString);
  }

  /** Advanced Settings > Default Routing/Specific Server **/

  saveRoutingInfo(type: any, selected: string) {
    this.defaultRoutingType = type;
    this.defaultRoutingServer = selected;
    this.localStorageService.set(Keys.ROUTING_TYPE, type);
    this.localStorageService.set(Keys.ROUTING_SELECTED_SERVER, selected);
  }

  saveSiteOverrides(overrides: Object) {
    this.siteOverrides = overrides;
    this.localStorageService.set(Keys.SITE_OVERRIDES, overrides);
  }

  /** New Main Page Layout Settings **/

  saveServerId(id: string) {
    this.serverId = id;
    this.localStorageService.set(Keys.SERVER_ID, id);
  }

  saveServerName(name: string) {
    this.serverName = name;
    this.localStorageService.set(Keys.SERVER_NAME, name);
  }

  saveServerFlag(flag: string) {
    this.serverFlag = flag;
    this.localStorageService.set(Keys.SERVER_FLAG, flag);
  }

  saveServerLevel(level: string) {
    this.serverLevel = level;
    this.localStorageService.set(Keys.SERVER_LEVEL, level);
  }

}
