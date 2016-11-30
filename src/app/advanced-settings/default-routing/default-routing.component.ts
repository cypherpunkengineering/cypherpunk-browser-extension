import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './default-routing.component.html',
  styleUrls: ['./default-routing.component.scss']
})
export class DefaultRoutingComponent {
  title = 'Default Routing';
  defaultRoutingSelection = 0;
  selectedCountry = 'N/A';
}

