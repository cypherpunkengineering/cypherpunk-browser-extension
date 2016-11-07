import { Component } from '@angular/core';
import { HqService } from '../hq.service';

@Component({
  selector: 'app-root',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent {
  serverList;
  title = 'Index';

  constructor(private hqService: HqService) {
    // chrome.proxy.settings.get({}, function(config) {
    //     console.log(config.value, config.value.host);
    // });
    chrome.webRequest.onAuthRequired.addListener(
      this.proxyAuth,
      {urls: ["<all_urls>"]},
      ['blocking']
    );
  }

  switchOnChange() {
    this.hqService.getServerList()
      .subscribe(
        serverList => {
          this.serverList = serverList;
          console.log(this.serverList);
        },
        error => console.log(<any>error)
      );
  }

  applyTestProxy() {
    console.log("apply test proxy");
    var config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: "204.145.66.40",
          port: 3128
        },
        bypassList: ["cypherpunk.engineering"]
      }
    };
    chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {});
  }

  proxyAuth(details) {
    return {
      authCredentials: {
        username: "test@test.test",
        password: "test123"
      }
    };
  }
}

