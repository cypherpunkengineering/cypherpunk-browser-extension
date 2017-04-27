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
import { AccountContainerComponent } from './account/account-container.component';
import { AccountComponent } from './account/account/account.component';
import { LoginComponent } from './login/login.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { ShareComponent } from './account/share/share.component';
import { ProxyModeComponent } from './settings/proxy-mode/proxy-mode.component';

import { HqService } from './hq.service';
import { ProxySettingsService } from './proxy-settings.service';
import { SettingsService } from './settings.service';
import { PingService } from './ping.service';

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
    AccountContainerComponent,
    LoginComponent,
    ConfirmComponent,
    ShareComponent,
    ProxyModeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      { path: 'settings', component: SettingsControllerComponent },
      { path: 'login', component: LoginComponent },
      { path: 'confirm/:email', component: ConfirmComponent },
      { path: '', component: MainComponent }
        // { path: '**', component: PageNotFoundComponent }
    ]),
    LocalStorageModule.withConfig({
      prefix: 'cypherpunk',
      storageType: 'localStorage'
    })
  ],
  providers: [
    HqService,
    ProxySettingsService,
    SettingsService,
    PingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
