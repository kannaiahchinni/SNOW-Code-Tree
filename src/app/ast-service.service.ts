import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable({
  providedIn: 'root'
})
export class AstService {

  constructor(private http: Http) { }

  getASTJSON(data) {
    const url = 'http://localhost:3000/api/ast/tree/parse',
    headers = new Headers({ 'Content-Type': 'application/json' , 'cache-control': 'no-cache'}),
    options = new RequestOptions({ headers: headers }),
    object = {'data': data},
    body = JSON.stringify(object);
     return this.http.post(url, body, options).map((response: Response) => {
        return response.json();
     });
  }

}
