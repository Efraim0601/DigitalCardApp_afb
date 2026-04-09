import { Routes } from '@angular/router';
import { adminAuthGuard } from './guards/admin-auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/admin-shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: 'cards',
        loadComponent: () =>
          import('./pages/cards-admin/cards-admin.page').then((m) => m.CardsAdminPageComponent)
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./pages/departments-admin/departments-admin.page').then(
            (m) => m.DepartmentsAdminPageComponent
          )
      },
      {
        path: 'job-titles',
        loadComponent: () =>
          import('./pages/job-titles-admin/job-titles-admin.page').then(
            (m) => m.JobTitlesAdminPageComponent
          )
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./pages/account-admin/account-admin.page').then((m) => m.AccountAdminPageComponent)
      },
      {
        path: 'smtp',
        loadComponent: () =>
          import('./pages/smtp-admin/smtp-admin.page').then((m) => m.SmtpAdminPageComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'cards' }
    ]
  },
  { path: '**', redirectTo: 'cards' }
];

