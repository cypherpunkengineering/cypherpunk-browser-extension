import { Injectable } from '@angular/core';

@Injectable()
export class PingService {

  min = arr => arr.reduce( ( p, c ) => { return ( p < c ? p : c ); } );

  getServerLatencyList(servers: [any], runs: number, accountType) {
    return Promise.all(servers.map(server => {
      // Ensure that server is available. If server is premium user must have premium account
      if (server.httpDefault.length && (server.level === 'free' || (server.level === 'premium' && accountType !== 'free'))) {
        let promises = [];
        for (let i = 0; i < runs; i++) {
          promises.push(this.getLatency(server.ovHostname, 1));
        }

        return Promise.all(promises)
        .then((pings) => { return { id: server.id, latency: this.min(pings) }; });
      }
      else { return Promise.resolve({ id: server.id, latency: 9999 }); }
    }))
    .then(latencyList => {
      return latencyList.sort((a, b) => { return a.latency - b.latency; });
    });
  }

  requestImage(url: string) {
    url = 'https://' + url + ':3128';
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => { resolve(img); };
      img.onerror = () => { reject(url); };
      img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
    });
  }

  getLatency(url: string, multiplier: number) {
    return new Promise((resolve, reject) => {
        let start = (new Date()).getTime();
        let response = () => {
            let delta = ((new Date()).getTime() - start);
            resolve(delta);
        };

        this.requestImage(url).then(response).catch(response);

        // If request times out set latency high, so it's low on the list
        setTimeout(() => { resolve(99999); }, 4000);
    });
  }
}
