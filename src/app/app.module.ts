import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { LocalStorageService, LOCAL_STORAGE_SERVICE_CONFIG } from 'angular-2-local-storage';

import { AppComponent } from './app.component';
import { SmartRoutesComponent } from './smart-routes/smart-routes.component';
import { AdvancedSettingsComponent } from './advanced-settings/advanced-settings.component';
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
    SelectedCountryComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      { path: 'smart-routes', component: SmartRoutesComponent },
      { path: 'advanced-settings', component: AdvancedSettingsComponent },
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
