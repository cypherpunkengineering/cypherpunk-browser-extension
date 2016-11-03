import { Component,Input, trigger, state, style, transition, animate } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './smart-routes.component.html',
  styleUrls: ['./smart-routes.component.css'],
  animations: [
    trigger('slideRight', [
      state('in', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(-100%)'}),
        animate(1000)
      ]),
      transition('* => void', [
        animate(1000, style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})
export class SmartRoutesComponent {
  title = 'Smart Routes';
}

