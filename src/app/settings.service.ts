import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';

class Keys {
  // Account Info
  public static ACCOUNT_TYPE = 'account.type';
  public static PROXY_USERNAME = 'proxy.username';
  public static PROXY_PASSWORD = 'proxy.password';

  // Server settings
  public static LATENCY_LIST = 'latencyList';
  public static PROXY_SERVERS = 'proxyServers';
  public static PROXY_SERVERS_ARR = 'proxyServersArr';
  public static PREMIUM_ACCOUNT = 'premiumAccount';
  public static PAC_SCRIPT_CONFIG = 'pacScriptConfig';
  public static STARRED_SERVERS = 'starredServers';

  // Index view
  public static ENABLED = 'enabled';
  public static ROUTING = 'routing';
  public static INITIALIZED = 'initialized';
  public static CACHED_SMART_SERVERS = 'cachedSmartServers';

  // Advanced Settings
  public static FORCE_HTTPS = 'settings.forceHttps';
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
  public static PRIVACY_FILTER_WHITELIST = 'privacyFilterWhitelist';
  public static PRIVACY_FILTER_ADS = 'settings.privacyFilter.blockAds';
  public static PRIVACY_FILTER_MALWARE = 'settings.privacyFilter.blockMalware';
}

class Defaults {
  public static CONFIG = {
    initialized: false,
    enabled: false,
    smartRoutingEnabled: true,
    privacyMode: true,
    privacyFilterWhitelist: {},
    routing: {},
    latencyList: [],
    proxyServers: {},
    proxyServersArr: [],
    starredServers: [],
    premiumAccount: false,
    pacScriptConfig: null,
    cachedSmartServers: null,
    account: { type: 'free' },
    settings: {
      forceHttps: true,
      ffWebRTCLeakProtection: false,
      webRTCLeakProtection: 'DEFAULT',
      defaultRouting: {
        type: 'SMART',
        selected: null
      },
      privacyFilter: {
        blockAds: true,
        blockMalware: true
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
  cachedSmartServers = {};
  routing = {};
  defaultRoutingType: string;
  defaultRoutingServer: string;
  privacyMode: boolean;
  privacyFilterAds: boolean;
  privacyFilterMalware: boolean;
  privacyFilterWhitelist = {};
  userAgentType: string;
  userAgentString: string;
  ffWebRtcLeakProtection: boolean;
  webRtcLeakProtection: string;

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
    this.cachedSmartServers = this.defaultSetting(Keys.CACHED_SMART_SERVERS);
    this.routing = this.defaultSetting(Keys.ROUTING);
    this.defaultRoutingType = this.defaultSetting(Keys.ROUTING_TYPE);
    this.defaultRoutingServer = this.defaultSetting(Keys.ROUTING_SELECTED_SERVER);
    this.forceHttp = this.defaultSetting(Keys.FORCE_HTTPS);
    this.privacyMode = this.defaultSetting(Keys.PRIVACY_MODE);
    this.privacyFilterAds = this.defaultSetting(Keys.PRIVACY_FILTER_ADS);
    this.privacyFilterMalware = this.defaultSetting(Keys.PRIVACY_FILTER_MALWARE);
    this.privacyFilterWhitelist = this.defaultSetting(Keys.PRIVACY_FILTER_WHITELIST);
    this.userAgentType = this.defaultSetting(Keys.USER_AGENT_TYPE);
    this.userAgentString = this.defaultSetting(Keys.USER_AGENT_STRING);
    if (this.isFirefox()) {
      this.ffWebRtcLeakProtection = this.defaultSetting(Keys.FF_WEB_RTC_LEAK_PROTECTION);
    }
    else {
      this.webRtcLeakProtection = this.defaultSetting(Keys.WEB_RTC_LEAK_PROTECTION);
    }
  }

  defaultSetting(key): any {
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
      proxyServersArr: this.localStorageService.get(Keys.PROXY_SERVERS_ARR),
      premiumAccount: this.localStorageService.get(Keys.PREMIUM_ACCOUNT),
      accountType: <string>this.localStorageService.get(Keys.ACCOUNT_TYPE)
    };
  }

  pacScriptSettings() {
    return {
      routing: this.localStorageService.get(Keys.ROUTING),
      defaultRouting: {
        type: this.localStorageService.get(Keys.ROUTING_TYPE),
        selected: this.localStorageService.get(Keys.ROUTING_SELECTED_SERVER)
      }
    };
  }

  saveAccountType(accountType: string) {
    this.localStorageService.set(Keys.ACCOUNT_TYPE, accountType);
  }

  saveCachedSmartServers(servers: Object) {
    this.localStorageService.set(Keys.CACHED_SMART_SERVERS, servers);
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

  saveLatencyList(arr: Object) {
    this.localStorageService.set(Keys.LATENCY_LIST, arr);
  }

  saveProxyServers(servers: Object, serverArr) {
    this.localStorageService.set(Keys.PROXY_SERVERS, servers);
    this.localStorageService.set(Keys.PROXY_SERVERS_ARR, serverArr);
  }

  saveCypherpunkEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.localStorageService.set(Keys.ENABLED, enabled);
  }

  saveRouting(routes: Object) {
    this.routing = routes;
    this.localStorageService.set(Keys.ROUTING, routes);
  }

  /** Smart Routing Selected Server Settings **/
  selectedServerSettings() {
    return {
      routing: this.localStorageService.get(Keys.ROUTING)
    };
  }

  /** Advanced Settings **/
  advancedSettings() {
    let settings = {
      defaultRouting: {
        type: this.localStorageService.get(Keys.ROUTING_TYPE),
        selected: this.localStorageService.get(Keys.ROUTING_SELECTED_SERVER)
      },
      forceHttps: this.localStorageService.get(Keys.FORCE_HTTPS),
      userAgentType: this.localStorageService.get(Keys.USER_AGENT_TYPE)
    };
    if (this.isFirefox()) {
      settings['ffWebRtcLeakProtection'] = this.localStorageService.get(Keys.FF_WEB_RTC_LEAK_PROTECTION);
    }
    else {
      settings['webRtcLeakProtection'] = this.localStorageService.get(Keys.WEB_RTC_LEAK_PROTECTION);
    }
    return settings;
  }

  saveForceHttps(enabled: boolean) {
    this.localStorageService.set(Keys.FORCE_HTTPS, enabled);
  }

  saveFFWebRtcLeakProtection(enabled: boolean) {
    this.localStorageService.set(Keys.FF_WEB_RTC_LEAK_PROTECTION, enabled);
  }

  /** Advanced Settings > WebRTC Leak Prevention **/
  webRtcSettings() {
    return {
      webRtcLeakProtection: this.localStorageService.get(Keys.WEB_RTC_LEAK_PROTECTION),
    };
  }

  saveWebRtcLeakProtection(type: string) {
    this.localStorageService.set(Keys.WEB_RTC_LEAK_PROTECTION, type);
  }

  /** Advanced Settings > Privacy Filter **/
  privacyFilterSettings() {
    return {
      whitelist: this.localStorageService.get(Keys.PRIVACY_FILTER_WHITELIST),
      blockAds: <boolean>this.localStorageService.get(Keys.PRIVACY_FILTER_ADS),
      blockMalware: <boolean>this.localStorageService.get(Keys.PRIVACY_FILTER_MALWARE)
    };
  }

  savePrivacyMode(privacyMode: boolean) {
    this.privacyMode = privacyMode;
    this.localStorageService.set(Keys.PRIVACY_MODE, privacyMode);
  }

  savePrivacyFilterWhitelist(list: Object) {
    this.localStorageService.set(Keys.PRIVACY_FILTER_WHITELIST, list);
  }

  savePrivacyFilterAds(enabled: boolean) {
    this.localStorageService.set(Keys.PRIVACY_FILTER_ADS, enabled);
  }

  savePrivacyFilterMalware(enabled: boolean) {
    this.localStorageService.set(Keys.PRIVACY_FILTER_MALWARE, enabled);
  }


  /** Advanced Settings > User Agent **/
  userAgentSettings() {
    return {
      userAgentType: this.localStorageService.get(Keys.USER_AGENT_TYPE),
      userAgentString: this.localStorageService.get(Keys.USER_AGENT_STRING)
    };
  }

  saveUserAgent(type: string, agentString: string) {
    this.localStorageService.set(Keys.USER_AGENT_TYPE, type);
    this.localStorageService.set(Keys.USER_AGENT_STRING, agentString);
  }

  /** Advanced Settings > Default Routing/Specific Server **/
  defaultRoutingSettings() {
    return {
      type: <string>this.localStorageService.get(Keys.ROUTING_TYPE),
      selected: <string>this.localStorageService.get(Keys.ROUTING_SELECTED_SERVER)
    };
  }

  saveRoutingInfo(type: any, selected: string) {
    this.localStorageService.set(Keys.ROUTING_TYPE, type);
    this.localStorageService.set(Keys.ROUTING_SELECTED_SERVER, selected);
  }

}
