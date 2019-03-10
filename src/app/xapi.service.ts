import { Injectable } from '@angular/core';
import * as TinCan from 'tincanjs';

@Injectable({
  providedIn: 'root'
})
export class XapiService {
  lrs: any;
  constructor() {
    try {
        this.lrs = new TinCan.LRS({
          endpoint: 'https://cloud.scorm.com/tc/14J462F4I9/sandbox/',
          username: '',
          password: '' ,
          allowFail: false
        });
    } catch (e) {
    }
  }
}
