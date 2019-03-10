import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable({
  providedIn: 'root'
})
export class AstService {

  constructor(private http: Http) { }

  prepareHeaders() {
    const headers = new Headers({ 'Content-Type': 'application/json' , 'cache-control': 'no-cache'}),
      options = new RequestOptions({ headers: headers});
      return options;
  }

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

  getList(type) {
    const url = type === 'course' ? 'http://localhost:3000/api/scorm/course/list' : 'http://localhost:3000/api/scorm/registration/list';
    return this.http.get(url, this.prepareHeaders()).map((response: Response) => {
      return response.json();
    });
  }

  getCourseDetails(courseid) {
    const url = 'http://localhost:3000/api/scorm/course/' + courseid;
    return this.http.get(url, this.prepareHeaders()).map((respone: Response) => {
      return respone.json();
    });
  }


  getUrl(reg: any ) {
    const url = 'http://localhost:3000/api/scorm/course/launch/url/' + reg.id ;
     return this.http.get(url, this.prepareHeaders()).map((response: Response) => {
       return response.json();
     });
  }

  registerCourse(course: any) {
    const url = 'http://localhost:3000/api/scorm/course/reg',
    body = {
      courseId: course.id,
      fName: 'Karunakar',
      lName: 'Medamoni',
      learnerId: 'karunakar.medamoni@servicenow.com'
    };
    return this.http.post(url, JSON.stringify(body),this.prepareHeaders()).map((response: Response) => {
        return response.json();
    });
  }

}
