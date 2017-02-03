import { Component, Output, EventEmitter } from '@angular/core';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss']
})
export class TutorialComponent {
  @Output() tutorialVisible = new EventEmitter<boolean>();

  tutorial = 1;

  constructor(private settingsService: SettingsService) {}

  allowAnalytics() {
    this.tutorialVisible.emit(false);
    this.settingsService.saveTutorialFinished();
    // Enable analytics once feature is implemented
  }

  saveTutorialFinished() {
    this.tutorialVisible.emit(false);
    this.settingsService.saveTutorialFinished();
  }
}

