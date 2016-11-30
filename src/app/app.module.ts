import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { LocalStorageService, LOCAL_STORAGE_SERVICE_CONFIG } from 'angular-2-local-storage';

import { AppComponent } from './app.component';
import { SmartRoutesComponent } from './smart-routes/smart-routes.component';
import { AdvancedSettingsComponent } from './advanced-settings/advanced-settings.component';
import { PrivacyFilterComponent } from './advanced-settings/privacy-filter/privacy-filter.component';
import { UserAgentComponent } from './advanced-settings/user-agent/user-agent.component';
import { DefaultRoutingComponent } from './advanced-settings/default-routing/default-routing.component';
import { SelectedCountryComponent } from './selected-country/selected-country.component';
import { IndexComponent } from './index/index.component';
import { HqService } from './hq.service';
import { ProxySettingsService } from './proxy-settings.service';

let localStorageServiceConfig = {
    prefix: 'cypherpunk',
    storageType: 'localStorage'
};

@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    SmartRoutesComponent,
    AdvancedSettingsComponent,
    PrivacyFilterComponent,
    UserAgentComponent,
    DefaultRoutingComponent,
    SelectedCountryComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      { path: 'smart-routes', component: SmartRoutesComponent },
      { path: 'advanced-settings', component: AdvancedSettingsComponent },
      { path: 'privacy-filter', component: PrivacyFilterComponent },
      { path: 'user-agent', component: UserAgentComponent },
      { path: 'default-routing', component: DefaultRoutingComponent },
      { path: 'selected-country', component: SelectedCountryComponent },
      { path: '', component: IndexComponent }
        // { path: '**', component: PageNotFoundComponent }
    ]),
  ],
  providers: [
    HqService,
    ProxySettingsService,
    LocalStorageService,
    { provide: LOCAL_STORAGE_SERVICE_CONFIG, useValue: localStorageServiceConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
