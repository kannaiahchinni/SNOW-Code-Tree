import { Component } from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import { AstService } from './ast-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'SNOW Code Tree';
  textAreaControl = new FormControl('', );
  outputControl = new FormControl('', );
  output: any;
  keys: any;
  result: any;
  currentKey = undefined;

  constructor(private astService: AstService) {}

  getASTJSON() {
    this.astService.getASTJSON(this.textAreaControl.value).subscribe(data => {
      this.output = data.memberFuncitons;
      this.result = data.callStack;
      console.log(this.result);
      this.outputControl.setValue(JSON.stringify(data));
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

}
