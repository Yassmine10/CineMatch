import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  },
  {
    path: '__/auth/action',
    loadComponent: () => import('./pages/reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  },
  {
    path: 'movie-detail/:id',
    loadComponent: () => import('./pages/movie-detail/movie-detail.page').then(m => m.MovieDetailPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'match-profile/:uid',
    loadComponent: () => import('./pages/matching/match-profile.page').then(m => m.MatchProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  // Redirections legacy /admin vers l'interface unifiée /tabs
  {
    path: 'admin',
    redirectTo: 'tabs/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin/dashboard',
    redirectTo: 'tabs/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin/movies',
    redirectTo: 'tabs/movies',
    pathMatch: 'full'
  },
  {
    path: 'admin/matching',
    redirectTo: 'tabs/matching',
    pathMatch: 'full'
  },
  {
    path: 'admin/users',
    redirectTo: 'tabs/users',
    pathMatch: 'full'
  },
  {
    path: 'admin/profile',
    redirectTo: 'tabs/profile',
    pathMatch: 'full'
  },
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
];
