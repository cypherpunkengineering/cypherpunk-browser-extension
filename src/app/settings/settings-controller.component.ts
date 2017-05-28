import { Component, Output, EventEmitter } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-settings-controller',
  templateUrl: './settings-controller.component.html',
  styleUrls: ['./settings-controller.component.scss']
})
export class SettingsControllerComponent {
  @Output() viewConnect = new EventEmitter();
  private changeDetectorRef: ChangeDetectorRef;
  currentView = 'app-settings';
  type;

  constructor( changeDetectorRef: ChangeDetectorRef ) {
    this.type = 'dynamic';
    this.changeDetectorRef = changeDetectorRef;
  }

  changeView(viewName: string) {
    if (viewName === 'home') {
      this.changeDetectorRef.detectChanges();
      this.currentView = 'app-settings';
      return this.viewConnect.emit();
    }
    this.changeDetectorRef.detectChanges();
    this.currentView = viewName;
  }
}
