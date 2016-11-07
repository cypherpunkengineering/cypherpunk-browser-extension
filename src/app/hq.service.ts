import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class HqService {
  constructor (private http: Http) {
    // Debug: get this header to check consistency with session token
    // chrome.cookies.get({url:'https://cypherpunk.engineering', name: 'cypherpunk.session'}, (cookie) => { 
    //   this.sessionCookie = cookie;
    // }); 
  }

  getServerList(): Observable<any> {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    let options = new RequestOptions({ headers: headers, withCredentials: true });
    return this.http.get('https://cypherpunk.engineering/api/v0/vpn/serverList', options)
      .map((res:Response) => res.json())
      .catch((error:any) => Observable.throw(error || 'getServerList Error'));
  }

  login(): Observable<any>  {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    let options = new RequestOptions({ headers: headers, withCredentials: true });
    return this.http.post('https://cypherpunk.engineering/api/v0/account/authenticate/userpasswd', '{"login":"test@test.test","password":"test123"}', options)
      .map((res:Response) => res.json())
      .catch((error:any) => Observable.throw(error || 'login Error'));
  }
}
