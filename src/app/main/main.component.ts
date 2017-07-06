import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  showAccount = false;
  showSettings = false;

  constructor() { }

  openAccount() { this.showAccount = true; }

  viewConnect() {
    this.showAccount = false;
    this.showSettings = false;
  }

  openSettings() { this.showSettings = true; }
}
