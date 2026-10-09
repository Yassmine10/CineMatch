import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const AdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    // Attendre que l'état auth soit résolu (pas null initial)
    filter(user => user !== null),
    take(1),
    map(user => {
      const role = (user?.role as string)?.trim();
      if (user && role === 'admin' && user.active) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};
