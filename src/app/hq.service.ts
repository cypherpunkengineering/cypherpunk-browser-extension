import { Observable } from 'rxjs/Rx';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

@Injectable()
export class HqService {
  options: RequestOptions;
  apiPrefix = 'https://api.cypherpunk.com/api/v1';
  browserObj: any = chrome ? chrome : chrome;

  constructor (private http: Http, private router: Router) {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    this.options = new RequestOptions({ headers: headers, withCredentials: true });
  }

  findServers(accountType: string): Observable<any> {
    return this.http.get(this.apiPrefix + '/location/list/' + accountType, this.options)
    .map((res: Response) => res.json())
    .catch((error: any) => Observable.throw(error || 'findServers Error'));
  }

  fetchUserStatus() {
    return this.http.get(this.apiPrefix + '/account/status').toPromise()
    .then((res) => { return res.json; })
    .catch((error: any) => {
      if (error.status === 403) {
        this.router.navigate(['/login']);
        throw new Error('No Account Found');
      }
      throw new Error('Error getting account status');
    });
  }

  findNetworkStatus(): Observable<any> {
    return this.http.get(this.apiPrefix + '/network/status')
    .map((res: Response) => res.json()) // TODO: This route should return valid JSON
    .catch((error: any) => Observable.throw(error || 'Error getting network status'));
  }

  identifyEmail(body, options): Observable<any> {
    return this.http.post(this.apiPrefix + '/account/identify/email', body, options)
    .catch((error: any) => { return Observable.throw(error); });
  }

  login(body, options) {
    let url = this.apiPrefix + '/account/authenticate/userpasswd';
    options.withCredentials = true;
    return this.http.post(url, body, options)
    .map((res: Response) => { return res.json(); });
  }

  register(body, options) {
    let url = this.apiPrefix + '/account/register/signup';
    options.withCredentials = true;
    return this.http.post(url, body, options)
    .map((res: Response) => { return res.json(); });
  }

  resend(body, options) {
    let url = this.apiPrefix + '/account/recover/email';
    options.withCrednetials = true;
    return this.http.post(url, body, options)
    .map((res: Response) => { return res.json(); });
  }

  debugCheckSession(): void {
    this.browserObj.cookies.get({url: 'https://cypherpunk.com', name: 'cypherpunk.session'}, (cookie) => {
      console.log(cookie);
    });
  }
}
