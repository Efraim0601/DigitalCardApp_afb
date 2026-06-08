import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./card/pages/create-card/create-card.page').then((m) => m.CreateCardPageComponent)
  },
  {
    path: 'card',
    loadComponent: () => import('./card/pages/card-page/card-page.component').then((m) => m.CardPageComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES)
  },
  { path: '**', redirectTo: 'login' }
];
