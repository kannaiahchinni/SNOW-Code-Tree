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
  program: any;
  keys: any;

  constructor(private astService: AstService) {}

  getASTJSON() {
    this.astService.getASTJSON(this.textAreaControl.value).subscribe(data => {
      this.output = data;
      this.outputControl.setValue(JSON.stringify(this.output));
      console.log(this.output);
      this.keys = Object.keys(this.output);
      console.log(this.keys);
    }, error => {
     console.log(error);
    });
 }

}
