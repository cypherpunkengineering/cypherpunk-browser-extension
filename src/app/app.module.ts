import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { LocalStorageModule } from 'angular-2-local-storage';

import { AppComponent } from './app.component';
import { SettingsComponent } from './settings/settings.component';
import { PrivacyFilterComponent } from './settings/privacy-filter/privacy-filter.component';
import { UserAgentComponent } from './settings/user-agent/user-agent.component';
import { WebRtcComponent } from './settings/web-rtc/web-rtc.component';
import { DefaultRoutingComponent } from './settings/default-routing/default-routing.component';
import { SpecificServerComponent } from './settings/default-routing/specific-server/specific-server.component';
import { SelectedServerComponent } from './selected-server/selected-server.component';
import { IndexComponent } from './index/index.component';
import { TutorialComponent } from './tutorial/tutorial.component';
import { SettingsControllerComponent } from './settings/settings-controller.component';
import { AccountContainerComponent } from './account/account-container.component';
import { AccountComponent } from './account/account/account.component';
import { ShareComponent } from './account/share/share.component';

import { HqService } from './hq.service';
import { ProxySettingsService } from './proxy-settings.service';
import { SettingsService } from './settings.service';
import { PingService } from './ping.service';

@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    TutorialComponent,
    SettingsComponent,
    PrivacyFilterComponent,
    UserAgentComponent,
    WebRtcComponent,
    DefaultRoutingComponent,
    SpecificServerComponent,
    SelectedServerComponent,
    SettingsControllerComponent,
    AccountComponent,
    AccountContainerComponent,
    ShareComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      { path: 'settings', component: SettingsControllerComponent },
      { path: 'settings/privacy-filter', component: PrivacyFilterComponent },
      { path: 'settings/user-agent', component: UserAgentComponent },
      { path: 'settings/web-rtc', component: WebRtcComponent },
      { path: 'settings/default-routing', component: DefaultRoutingComponent },
      { path: 'advanced-settings/default-routing/specific-server', component: SpecificServerComponent },
      { path: 'selected-server', component: SelectedServerComponent },
      { path: 'account', component: AccountContainerComponent },
      { path: '', component: IndexComponent }
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
