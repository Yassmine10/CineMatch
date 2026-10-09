import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'movies',
        loadComponent: () => import('../movies/movies.page').then(m => m.MoviesPage)
      },
      {
        path: 'playlist',
        loadComponent: () => import('../playlist/playlist.page').then(m => m.PlaylistPage)
      },
      {
        path: 'matching',
        loadComponent: () => import('../matching/matching.page').then(m => m.MatchingPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'match-profile/:uid',
        loadComponent: () => import('../match-profile/match-profile.page').then(m => m.MatchProfilePage)
      },
      {
        path: '',
        redirectTo: 'movies',
        pathMatch: 'full'
      }
    ]
  }
];
