import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import {Subject} from "rxjs/Subject";

@Injectable()
export class PingService {
  pingStream: Subject<number> = new Subject<number>();
  ping: number = 0;
  headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
  options = new RequestOptions({ headers: this.headers, withCredentials: true });

  constructor(private http: Http) {}

  getLatency(url: string) {
    url = 'http://' + url;
    console.log(url);
    let timeStart: number = performance.now();
    return this.http.get(url, this.options).map((data) => {
      let timeEnd: number = performance.now();
      let ping: number = timeEnd - timeStart;
      return ping;
    });
  }
}
