import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';

// Application Settings
// Smart routing on/off
// Privacy filter on/off
//
// Advanced Settings
// Routing Type:
// - Smart routing
// - Fastest server
// - Specific country
// - Do not proxy (direct)
// Force HTTPS
// WebRTC Leak Protection
// Privacy Filter Settings:
// - Enable/disable
// - Block ads
// - Block trackers
// - Block malware
// User Agent:
// - private
// - ios/android?
//
class Keys {
  public static PROXY_USERNAME = 'proxy.username';
  public static PROXY_PASSWORD = 'proxy.password';
  public static LATENCY_LIST = 'latencyList';
  public static PROXY_SERVERS = 'proxyServers';
  public static PROXY_SERVERS_ARR = 'proxyServersArr';
  public static PREMIUM_ACCOUNT = 'premiumAccount';
  public static PAC_SCRIPT_CONFIG = 'pacScriptConfig';

  // Index vivew
  public static INITIALIZED = 'intialized';
  public static ENABLED = 'enabled';
  public static SMART_ROUTING_ENABLED = 'smartRoutingEnabled';
  public static PRIVACY_FILTER_WHITELIST = 'privacyFilterWhitelist';
  public static ROUTING = 'routing';
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
  public static PRIVACY_FILTER_ENABLED = 'settings.privacyFilter.enabled';
  public static PRIVACY_FILTER_ADS = 'settings.privacyFilter.blockAds';
  public static PRIVACY_FILTER_TRACKERS = 'settings.privacyFilter.blockTrackers';
  public static PRIVACY_FILTER_MALWARE = 'settings.privacyFilter.blockMalware';
}

class Defaults {
  public static CONFIG = {
    intialized: true,
    enabled: false,
    smartRoutingEnabled: true,
    privacyFilterWhitelist: {},
    routing: {},
    latencyList: null,
    proxyServers: null,
    proxyServersArr: [],
    premiumAccount: false,
    pacScriptConfig: null,
    cachedSmartServers: null,
    settings: {
      forceHttps: true,
      ffWebRTCLeakProtection: true,
      webRTCLeakProtection: 'DISABLE_NON_PROXIED_UDP',
      defaultRouting: {
        type: 'SMART',
        selected: null
      },
      privacyFilter: {
        enabled: false,
        blockAds: true,
        blockTrackers: true,
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
  constructor (private localStorageService: LocalStorageService) {
    let initialized = this.localStorageService.get(Keys.INITIALIZED);

    // Settings haven't been initialized yet, set defaults
    if (!initialized) {
      this.localStorageService.set(Keys.ENABLED, Defaults.getVal(Keys.ENABLED));
      this.localStorageService.set(Keys.LATENCY_LIST, Defaults.getVal(Keys.LATENCY_LIST));
      this.localStorageService.set(Keys.PROXY_SERVERS, Defaults.getVal(Keys.PROXY_SERVERS));
      this.localStorageService.set(Keys.PROXY_SERVERS_ARR, Defaults.getVal(Keys.PROXY_SERVERS_ARR));
      this.localStorageService.set(Keys.PREMIUM_ACCOUNT, Defaults.getVal(Keys.PREMIUM_ACCOUNT));
      this.localStorageService.set(Keys.SMART_ROUTING_ENABLED, Defaults.getVal(Keys.SMART_ROUTING_ENABLED));
      this.localStorageService.set(Keys.PRIVACY_FILTER_WHITELIST, Defaults.getVal(Keys.PRIVACY_FILTER_WHITELIST));
      this.localStorageService.set(Keys.CACHED_SMART_SERVERS, Defaults.getVal(Keys.CACHED_SMART_SERVERS));
      this.localStorageService.set(Keys.ROUTING, Defaults.getVal(Keys.ROUTING));
      this.localStorageService.set(Keys.ROUTING_TYPE, Defaults.getVal(Keys.ROUTING_TYPE));
      this.localStorageService.set(Keys.ROUTING_SELECTED_SERVER, Defaults.getVal(Keys.ROUTING_SELECTED_SERVER));
      this.localStorageService.set(Keys.FORCE_HTTPS, Defaults.getVal(Keys.FORCE_HTTPS));
      this.localStorageService.set(Keys.PRIVACY_FILTER_ENABLED, Defaults.getVal(Keys.PRIVACY_FILTER_ENABLED));
      this.localStorageService.set(Keys.PRIVACY_FILTER_ADS, Defaults.getVal(Keys.PRIVACY_FILTER_ADS));
      this.localStorageService.set(Keys.PRIVACY_FILTER_TRACKERS, Defaults.getVal(Keys.PRIVACY_FILTER_TRACKERS));
      this.localStorageService.set(Keys.PRIVACY_FILTER_MALWARE, Defaults.getVal(Keys.PRIVACY_FILTER_MALWARE));
      this.localStorageService.set(Keys.USER_AGENT_TYPE, Defaults.getVal(Keys.USER_AGENT_TYPE));
      this.localStorageService.set(Keys.USER_AGENT_STRING, Defaults.getVal(Keys.USER_AGENT_STRING));

      if (this.isFirefox()) {
        this.localStorageService.set(Keys.FF_WEB_RTC_LEAK_PROTECTION, Defaults.getVal(Keys.FF_WEB_RTC_LEAK_PROTECTION));
      }
      else {
        this.localStorageService.set(Keys.WEB_RTC_LEAK_PROTECTION, Defaults.getVal(Keys.WEB_RTC_LEAK_PROTECTION));
      }
    }
  }

  /* Returns if browser is firefox or not */
  isFirefox() {
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
      premiumAccount: this.localStorageService.get(Keys.PREMIUM_ACCOUNT)
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

  saveCachedSmartServers(smartServers) {
    this.localStorageService.set(Keys.CACHED_SMART_SERVERS, smartServers);
  }

  savePacScriptConfig(config) {
    this.localStorageService.set(Keys.PAC_SCRIPT_CONFIG, config);
  }

  /** Index Settings **/
  indexSettings() {
    return {
      showTutorial: !this.localStorageService.get(Keys.INITIALIZED),
      cypherpunkEnabled: this.localStorageService.get(Keys.ENABLED),
      smartRoutingEnabled: this.localStorageService.get(Keys.SMART_ROUTING_ENABLED),
      routing: this.localStorageService.get(Keys.ROUTING),
      cachedSmartServers: this.localStorageService.get(Keys.CACHED_SMART_SERVERS),
      defaultRouting: {
        type: this.localStorageService.get(Keys.ROUTING_TYPE),
        selected: this.localStorageService.get(Keys.ROUTING_SELECTED_SERVER)
      },
      proxyCredentials: {
        username: this.localStorageService.get(Keys.PROXY_USERNAME),
        password: this.localStorageService.get(Keys.PROXY_PASSWORD)
      },
      privacyFilter: {
        enabled: this.localStorageService.get(Keys.PRIVACY_FILTER_ENABLED),
        whitelist: this.localStorageService.get(Keys.PRIVACY_FILTER_WHITELIST)
      }
    };
  }

  saveTutorialFinished() {
    this.localStorageService.set(Keys.INITIALIZED, Defaults.getVal(Keys.INITIALIZED));
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
    console.log('CypherPunk Saving bool', enabled);
    this.localStorageService.set(Keys.ENABLED, enabled);
  }

  saveSmartRoutingEnabled(enabled: boolean) {
    this.localStorageService.set(Keys.SMART_ROUTING_ENABLED, enabled);
  }

  savePrivacyFilterWhitelist(list: Object) {
    this.localStorageService.set(Keys.PRIVACY_FILTER_WHITELIST, list);
  }

  saveRouting(routes: Object) {
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
      enabled: this.localStorageService.get(Keys.PRIVACY_FILTER_ENABLED),
      blockAds: this.localStorageService.get(Keys.PRIVACY_FILTER_ADS),
      blockTrackers: this.localStorageService.get(Keys.PRIVACY_FILTER_TRACKERS),
      blockMalware: this.localStorageService.get(Keys.PRIVACY_FILTER_MALWARE)
    };
  }

  savePrivacyFilterEnabled(enabled: boolean) {
    this.localStorageService.set(Keys.PRIVACY_FILTER_ENABLED, enabled);
  }

  savePrivacyFilterAds(enabled: boolean) {
    this.localStorageService.set(Keys.PRIVACY_FILTER_ADS, enabled);
  }

  savePrivacyFilterTrackers(enabled: boolean) {
    this.localStorageService.set(Keys.PRIVACY_FILTER_TRACKERS, enabled);
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
      type: this.localStorageService.get(Keys.ROUTING_TYPE),
      selected: this.localStorageService.get(Keys.ROUTING_SELECTED_SERVER)
    };
  }

  saveRoutingInfo(type: any, selected: string) {
    this.localStorageService.set(Keys.ROUTING_TYPE, type);
    this.localStorageService.set(Keys.ROUTING_SELECTED_SERVER, selected);
  }

}
