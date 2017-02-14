import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class HqService {
  options: RequestOptions;
  apiPrefix = 'https://cypherpunk.privacy.network/api/v0';
  browserObj: any = chrome ? chrome : chrome;

  constructor (private http: Http) {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    this.options = new RequestOptions({ headers: headers, withCredentials: true });
  }

  findServers(accountType: string): Observable<any> {
    return this.http.get(this.apiPrefix + '/location/list/' + accountType, this.options)
    .map((res: Response) => res.json())
    .catch((error: any) => Observable.throw(error || 'findServers Error'));
  }

  testLogin(): Observable<any>  {
    let url = this.apiPrefix + '/account/authenticate/userpasswd';
    let body = { login: 'test@test.test', password: 'test123' };
    return this.http.post(url, body, this.options)
      .map((res: Response) => res.json())
      .catch((error: any) => Observable.throw(error || 'login Error'));
  }

  fetchUserStatus(): Observable<any> {
    return this.http.get(this.apiPrefix + '/account/status')
    .map((res: Response) => res.json())
    .catch((error: any) => {
      console.log(error);
      if (error.status === 403) {
        this.browserObj.tabs.create({'url': 'https://cypherpunk.com/login'});
        window.close();
      }
      return Observable.throw(error || 'Error getting account status');
    });
  }

  findNetworkStatus(): Observable<any> {
    return this.http.get(this.apiPrefix + '/network/status')
    .map((res: Response) => res.json()) // TODO: This route should return valid JSON
    .catch((error: any) => Observable.throw(error || 'Error getting network status'));
  }

  debugCheckSession(): void {
    this.browserObj.cookies.get({url: 'https://cypherpunk.com', name: 'cypherpunk.session'}, (cookie) => {
      console.log(cookie);
    });
  }
}
