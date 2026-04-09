import { Routes } from '@angular/router';

export const CARD_ROUTES: Routes = [
  {
    path: 'demo',
    loadComponent: () =>
      import('./pages/card-demo/card-demo.page').then((m) => m.CardDemoPageComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'demo' }
];

