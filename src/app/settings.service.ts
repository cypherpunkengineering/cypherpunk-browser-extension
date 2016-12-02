import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
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
  public static PROXY_USERNAME: string = "proxy.username";
  public static PROXY_PASSWORD: string = "proxy.password";

  public static INITIALIZED: string = "intialized";
  public static ENABLED: string = "enabled";
  public static SMART_ROUTING_ENABLED: string = "smartRoutingEnabled";
  public static PRIVACY_FILTER_WHITELIST: string = "privacyFilterWhitelist";

  public static ROUTING_TYPE: string = "advanced.routingType";
  public static FORCE_HTTPS: string = "advanced.forceHttps";
  public static WEB_RTC_LEAK_PROTECTION: string = "advanced.webRTCLeakProtection";
  public static USER_AGENT: string = "advanced.userAgent";

  public static PRIVACY_FILTER_ENABLED: string = "advanced.privacyFilter.enabled";
  public static PRIVACY_FILTER_ADS: string = "advanced.privacyFilter.blockAds";
  public static PRIVACY_FILTER_TRACKERS: string = "advanced.privacyFilter.blockTrackers";
  public static PRIVACY_FILTER_MALWARE: string = "advanced.privacyFilter.blockMalware";
}

class Defaults {
  public static CONFIG = {
    intialized: true,
    enabled: false,
    smartRoutingEnabled: false,
    privacyFilterWhitelist: {},
    advanced: {
      routingType: "smart",
      forceHttps: true,
      webRTCLeakProtection: true,
      privacyFilter: {
        enabled: true,
        blockAds: true,
        blockTrackers: true,
        blockMalware: true
      },
      userAgent: ""
    }
  };

  public static getVal(keyPath) {
    return keyPath.split('.').reduce((o,i)=>o[i], Defaults.CONFIG);
  };
}

@Injectable()
export class SettingsService {
  constructor (
    private localStorageService: LocalStorageService
  ) {
    let initialized = this.localStorageService.get(Keys.INITIALIZED);

    // Settings haven't been initialized yet, set defaults
    if (!initialized) {
      this.localStorageService.set(Keys.INITIALIZED, Defaults.getVal(Keys.INITIALIZED));
      this.localStorageService.set(Keys.ENABLED, Defaults.getVal(Keys.ENABLED));
      this.localStorageService.set(Keys.SMART_ROUTING_ENABLED, Defaults.getVal(Keys.SMART_ROUTING_ENABLED));
      this.localStorageService.set(Keys.PRIVACY_FILTER_WHITELIST, Defaults.getVal(Keys.PRIVACY_FILTER_WHITELIST));
      this.localStorageService.set(Keys.ROUTING_TYPE, Defaults.getVal(Keys.ROUTING_TYPE));
      this.localStorageService.set(Keys.FORCE_HTTPS, Defaults.getVal(Keys.FORCE_HTTPS));
      this.localStorageService.set(Keys.WEB_RTC_LEAK_PROTECTION, Defaults.getVal(Keys.WEB_RTC_LEAK_PROTECTION));
      this.localStorageService.set(Keys.PRIVACY_FILTER_ENABLED, Defaults.getVal(Keys.PRIVACY_FILTER_ENABLED));
      this.localStorageService.set(Keys.PRIVACY_FILTER_ADS, Defaults.getVal(Keys.PRIVACY_FILTER_ADS));
      this.localStorageService.set(Keys.PRIVACY_FILTER_TRACKERS, Defaults.getVal(Keys.PRIVACY_FILTER_TRACKERS));
      this.localStorageService.set(Keys.PRIVACY_FILTER_MALWARE, Defaults.getVal(Keys.PRIVACY_FILTER_MALWARE));
      this.localStorageService.set(Keys.USER_AGENT, Defaults.getVal(Keys.USER_AGENT));
    }
  }

  /** Index Settings **/
  indexSettings() {
    return {
      cypherpunkEnabled: this.localStorageService.get(Keys.ENABLED),
      smartRoutingEnabled: this.localStorageService.get(Keys.SMART_ROUTING_ENABLED),
      proxyCredentials: {
        username: this.localStorageService.get(Keys.PROXY_USERNAME),
        password: this.localStorageService.get(Keys.PROXY_PASSWORD)
      },
      privacyFilter: {
        enabled: this.localStorageService.get(Keys.PRIVACY_FILTER_ENABLED),
        whitelist: this.localStorageService.get(Keys.PRIVACY_FILTER_WHITELIST)
      }
    }
  }

  saveProxyCredentials(username: string, password: string) {
    this.localStorageService.set(Keys.PROXY_USERNAME, username);
    this.localStorageService.set(Keys.PROXY_PASSWORD, password);
  }

  saveCypherpunkEnabled(enabled: boolean) {
    this.localStorageService.set(Keys.ENABLED, enabled);
  }

  saveSmartRoutingEnabled(enabled: boolean) {
    this.localStorageService.set(Keys.SMART_ROUTING_ENABLED, enabled);
  }

  savePrivacyFilterWhitelist(list: Object) {
    this.localStorageService.set(Keys.PRIVACY_FILTER_WHITELIST, list)
  }

  /** Advanced Settings **/
  advancedSettings() {
    return {
      defaultRouting: this.localStorageService.get(Keys.ROUTING_TYPE),
      forceHttps: this.localStorageService.get(Keys.FORCE_HTTPS),
      webRtcLeakProtection: this.localStorageService.get(Keys.WEB_RTC_LEAK_PROTECTION),
      userAgent: this.localStorageService.get(Keys.USER_AGENT)
    }
  }

  saveForceHttps(enabled: boolean) {
    this.localStorageService.set(Keys.FORCE_HTTPS, enabled);
  }

  saveWebRtcLeakProtection(enabled: boolean) {
    this.localStorageService.set(Keys.WEB_RTC_LEAK_PROTECTION, enabled);
  }

  /** Advanced Settings > Privacy Filter **/
  privacyFilterSettings() {
    return {
      enabled: this.localStorageService.get(Keys.PRIVACY_FILTER_ENABLED),
      blockAds: this.localStorageService.get(Keys.PRIVACY_FILTER_ADS),
      blockTrackers: this.localStorageService.get(Keys.PRIVACY_FILTER_TRACKERS),
      blockMalware: this.localStorageService.get(Keys.PRIVACY_FILTER_MALWARE)
    }
  }
}
