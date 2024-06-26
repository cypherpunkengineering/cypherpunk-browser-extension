import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { LocalStorageModule } from 'angular-2-local-storage';

import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { SettingsComponent } from './settings/settings.component';
import { PrivacyFilterComponent } from './settings/privacy-filter/privacy-filter.component';
import { UserAgentComponent } from './settings/user-agent/user-agent.component';
import { WebRtcComponent } from './settings/web-rtc/web-rtc.component';
import { IndexComponent } from './index/index.component';
import { TutorialComponent } from './tutorial/tutorial.component';
import { SettingsControllerComponent } from './settings/settings-controller.component';
import { AccountComponent } from './account/account.component';
import { LoginComponent } from './login/login.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { PendingComponent } from './pending/pending.component';
import { ProxyModeComponent } from './settings/proxy-mode/proxy-mode.component';

import { HqService } from './hq.service';
import { PingService } from './ping.service';
import { SettingsService } from './settings.service';
import { SessionService } from './session.service';
import { ProxySettingsService } from './proxy-settings.service';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    IndexComponent,
    TutorialComponent,
    SettingsComponent,
    PrivacyFilterComponent,
    UserAgentComponent,
    WebRtcComponent,
    SettingsControllerComponent,
    AccountComponent,
    LoginComponent,
    ConfirmComponent,
    PendingComponent,
    ProxyModeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      { path: 'login', component: LoginComponent },
      { path: 'confirm', component: ConfirmComponent },
      { path: 'confirm/:login', component: ConfirmComponent },
      { path: 'pending', component: PendingComponent },
      { path: '', component: MainComponent }
    ]),
    LocalStorageModule.withConfig({
      prefix: 'cypherpunk',
      storageType: 'localStorage'
    })
  ],
  providers: [
    HqService,
    PingService,
    SessionService,
    SettingsService,
    ProxySettingsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
