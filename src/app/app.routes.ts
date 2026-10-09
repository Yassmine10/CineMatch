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
    path: 'movie-detail/:id',
    loadComponent: () => import('./pages/movie-detail/movie-detail.page').then(m => m.MovieDetailPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'match-profile/:uid',
    loadComponent: () => import('./pages/match-profile/match-profile.page').then(m => m.MatchProfilePage),
    canActivate: [AuthGuard]
  },
  {
    // Interface utilisateur classique
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  {
    // Interface admin séparée — accessible uniquement aux admins
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin-tabs/admin-tabs.routes').then(m => m.adminRoutes),
    canActivate: [AdminGuard]
  },
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
];
