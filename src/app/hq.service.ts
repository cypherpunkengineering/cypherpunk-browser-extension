import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class HqService {
  options: RequestOptions;

  constructor (private http: Http) {
    let headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    this.options = new RequestOptions({ headers: headers, withCredentials: true });
  }

  getServerList(): Observable<any> {
    return this.http.get('https://cypherpunk.engineering/api/v0/vpn/serverList', this.options)
      .map((res:Response) => res.json())
      .catch((error:any) => Observable.throw(error || 'getServerList Error'));
  }

  login(): Observable<any>  {
    return this.http.post('https://cypherpunk.engineering/api/v0/account/authenticate/userpasswd', '{"login":"test@test.test","password":"test123"}', this.options)
      .map((res:Response) => res.json())
      .catch((error:any) => Observable.throw(error || 'login Error'));
  }

  debugCheckSession(): void {
    // Debug: get this header to check consistency with session token
    chrome.cookies.get({url:'https://cypherpunk.engineering', name: 'cypherpunk.session'}, (cookie) => { 
      console.log(cookie);
    }); 
  }
}
