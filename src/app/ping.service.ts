import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import {Subject} from "rxjs/Subject";

@Injectable()
export class PingService {

  average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

  getServerLatencyList(servers: [any], runs: number, premium) {
    return Promise.all(servers.map(server => {
      // Ensure that server is available. If server is premium user must have premium account
      if (server.httpDefault.length && (server.level === 'premium' && premium || server.level === 'free')) {
        var promises = [];
        for (let i = 0; i < runs; i++) { promises.push(this.getLatency(server.ovHostname, 1)); }

        return Promise.all(promises)
        .then((pings) => {
          return { id: server.id, latency: this.average(pings) };
        });
      }
      else { return Promise.resolve({ id: server.id, latency: 9999 }); }
    }))
    .then(latencyList => {
      return latencyList.sort((a, b) => { return a.latency - b.latency; });
    });
  }


  requestImage(url: string) {
    url = 'https://' + url;
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.onload = () => { resolve(img); };
      img.onerror = () => { reject(url); };
      img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
    });
  }

  getLatency(url: string, multiplier: number) {
    return new Promise((resolve, reject) => {
        var start = (new Date()).getTime();
        var response = () => {
            var delta = ((new Date()).getTime() - start);
            delta *= (multiplier || 1);
            resolve(delta);
        };

        this.requestImage(url).then(response).catch(response);

        // If request times out set latency high, so it's low on the list
        setTimeout(() => { resolve(999); }, 2000);
    });
  }
}
