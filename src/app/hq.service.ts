import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class HqService {
  options: RequestOptions;
  apiPrefix: string = 'https://cypherpunk.com/api/v0';

  constructor (private http: Http) {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    this.options = new RequestOptions({ headers: headers, withCredentials: true });
  }

  findServers(): Observable<any> {
    return this.http.get(this.apiPrefix + '/vpn/serverList', this.options)
      .map((res:Response) => res.json())
      .catch((error:any) => Observable.throw(error || 'findServers Error'));
  }

  login(): Observable<any>  {
    return this.http.post(this.apiPrefix + '/account/authenticate/userpasswd', '{"login":"test@test.test","password":"test123"}', this.options)
      .map((res:Response) => {
           console.log(res);
           res.json();
      })
      .catch((error:any) => Observable.throw(error || 'login Error'));
  }

  fetchUserStatus(): Observable<any> {
    return this.http.get(this.apiPrefix + '/account/status')
    .map((res:Response) => res.json())
    .catch((error:any) => Observable.throw(error || 'Error fetching account status'));
  }

  debugCheckSession(): void {
    // Debug: get this header to check consistency with session token
    chrome.cookies.get({url:'https://cypherpunk.com', name: 'cypherpunk.session'}, (cookie) => {
      console.log(cookie);
    });
  }
}
