import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import {Subject} from "rxjs/Subject";

@Injectable()
export class PingService {

  average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

  getServerLatencyList(servers: [any], runs: number) {
    return new Promise((resolve, reject) => {
      resolve(servers.map(server => {
        if (server.httpDefault) {

          var promise = this.getLatency(server.ovHostname, 1);
          var promises = Array(runs).fill(promise);

          return Promise.all(promises).then((vals) => {
            return { id: server.id, latency: this.average(vals) };
          }).catch(reject);

        }
        else { return { id: server.id, latency: -1 } }
      }));
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

        var requestImage = (url) => {
          url = 'https://' + url;
          return new Promise((resolve, reject) => {
            var img = new Image();
            img.onload = () => { resolve(img); };
            img.onerror = () => { reject(url); };
            img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
          });
        }

        requestImage(url).then(response).catch(response);

    });
  }
}
