import { Component,Input, trigger, state, style, transition, animate } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  animations: [
    trigger('slideRight', [
      state('in', style({transform: 'translateX(0)'})),
      transition('* => void', [
        animate(1000, style({transform: 'translateX(100%)'}))
      ]),
      transition('* => inactive', [
        animate(1000, style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})
export class IndexComponent {
  title = 'Index';
}

