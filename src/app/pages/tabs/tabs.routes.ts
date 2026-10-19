import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../admin/admin-dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage)
      },
      {
        path: 'movies',
        loadComponent: () =>
          import('../movies/movies.page').then(m => m.MoviesPage)
      },
      {
        path: 'playlist',
        loadComponent: () =>
          import('../playlist/playlist.page').then(m => m.PlaylistPage)
      },
      {
        path: 'matching',
        loadComponent: () =>
          import('../matching/matching.page').then(m => m.MatchingPage)
      },
      {
        path: 'matching/:uid',
        loadComponent: () =>
          import('../match-profile/match-profile.page').then(m => m.MatchProfilePage)
      },
      {
        path: 'match-profile/:uid',
        loadComponent: () =>
          import('../match-profile/match-profile.page').then(m => m.MatchProfilePage)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('../admin/admin-users/admin-users.page').then(m => m.AdminUsersPage)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: '',
        redirectTo: 'movies',
        pathMatch: 'full'
      }
    ]
  }
];
