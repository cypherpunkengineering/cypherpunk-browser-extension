import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss']
})
export class ShareComponent {
  @Input() user;
  @Output() changeView = new EventEmitter<string>();

  constructor() { }

  open(url: string) {
    chrome.tabs.create({ url: url });
  }

  goToView(name: string) {
    this.changeView.emit(name);
  }
}
