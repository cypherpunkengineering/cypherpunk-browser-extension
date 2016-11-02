import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { SmartRoutesComponent } from './smart-routes/smart-routes.component';
import { IndexComponent } from './index/index.component';

@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    SmartRoutesComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      { path: 'smart-routes', component: SmartRoutesComponent },
      { path: '', component: IndexComponent }
        // { path: '**', component: PageNotFoundComponent }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
