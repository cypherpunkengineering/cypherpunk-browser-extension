import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { SmartRoutesComponent } from './smart-routes/smart-routes.component';
import { AdvancedSettingsComponent } from './advanced-settings/advanced-settings.component';
import { IndexComponent } from './index/index.component';
import { HqService } from './hq.service';
import { ProxySettingsService } from './proxy-settings.service';

@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    SmartRoutesComponent,
    AdvancedSettingsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      { path: 'smart-routes', component: SmartRoutesComponent },
      { path: 'advanced-settings', component: AdvancedSettingsComponent },
      { path: '', component: IndexComponent }
        // { path: '**', component: PageNotFoundComponent }
    ])
  ],
  providers: [ HqService, ProxySettingsService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
