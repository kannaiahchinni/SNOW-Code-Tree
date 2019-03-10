import { Component, OnInit } from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import { AstService } from './ast-service.service';
import { DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SNOW Code Tree';
  textAreaControl = new FormControl('', );
  outputControl = new FormControl('', );
  typeControl = new FormControl('', [Validators.required]);
  output: any;
  keys: any;
  result: any;
  currentKey = undefined;
  type: any;
  registrations: any = [];
  courseList: any = [];
  launchUrl: SafeResourceUrl;

  constructor(private astService: AstService, public domSanitizer: DomSanitizer ) {

  }

  ngOnInit() {
    /*  this.astService.getList('course').subscribe(data => {
        console.log(data);
      });
    this.astService.getList('registration').subscribe(data => {
        this.registrations = data || [];
        console.log(data);
    }); */
  }

  getASTJSON() {

    const request = [];
    console.log(this.typeControl.value);
    request.push({
      type: this.typeControl.value,
      data: this.textAreaControl.value,
      result: ''
    });
    console.log(request);
    this.astService.getASTJSON(request).subscribe(data => {
      const resultData = data[0].result;
      this.output = resultData.memberFunctions;
      this.result = resultData.callStack;
      console.log(this.result);
      this.outputControl.setValue(JSON.stringify(resultData));
      console.log(this.output);
      this.keys = Object.keys(this.output);
      console.log(this.keys);
    }, error => {
     console.log(error);
    });
 }

 showTree(key) {
    this.currentKey = this.currentKey === key ? undefined : key;
 }

 getLanuchUrl(reg) {
    this.astService.getUrl(reg).subscribe(data => {
        console.log(data);
        this.launchUrl =  this.domSanitizer.bypassSecurityTrustResourceUrl(data.url);
    });
 }

 resizeFrame(myFrame) {
   console.log(myFrame);
 }

  fileContent(event) {
    console.log(event);
  }


  getList(type) {
    this.astService.getList(type).subscribe(data => {
      if (type === 'registration') {
        this.registrations = data || [];
      } else {
        this.courseList = data  || [];
      }
      console.log(data);
    });
  }

  getCourseDetails(course: any) {
    this.astService.getCourseDetails(course.id).subscribe(data => {
      console.log(data);
    });
  }

  registerCourse(course: any) {
    console.log(course);
    this.astService.registerCourse(course).subscribe(data => {
       console.log(data);
    });
  }

}
