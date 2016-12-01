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
}

@Injectable()
export class SettingsService {
  constructor (
    private localStorageService: LocalStorageService
  ) {
  }

  proxyCredentials() {
    return {
      username: this.localStorageService.get(Keys.PROXY_USERNAME),
      password: this.localStorageService.get(Keys.PROXY_PASSWORD),
    }
  }
  saveProxyCredentials(username: string, password: string) {
    console.log(Keys.PROXY_USERNAME);
    console.log(Keys.PROXY_PASSWORD);
    this.localStorageService.set(Keys.PROXY_USERNAME, username);
    this.localStorageService.set(Keys.PROXY_PASSWORD, password);

    console.log(this.proxyCredentials());
  }
}
