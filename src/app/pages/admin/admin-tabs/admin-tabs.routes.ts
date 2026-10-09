import { Routes } from '@angular/router';
import { AdminTabsPage } from './admin-tabs.page';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminTabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../admin-dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage)
      },
      {
        path: 'movies',
        loadComponent: () =>
          import('../admin-movies/admin-movies.page').then(m => m.AdminMoviesPage)
      },
      {
        path: 'admin-movies',
        redirectTo: 'movies',
        pathMatch: 'full'
      },
      {
        path: 'users',
        loadComponent: () =>
          import('../admin-users/admin-users.page').then(m => m.AdminUsersPage)
      },
      {
        path: 'admin-users',
        redirectTo: 'users',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../admin-profile/admin-profile.page').then(m => m.AdminProfilePage)
      },
      {
        path: 'admin-profile',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
