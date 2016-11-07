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
        proxyForHttp: {
          scheme: "http",
          host: "208.111.48.151"
        },
        bypassList: ["cypherpunk.engineering"]
      }
    };
    chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {});
  }
}

