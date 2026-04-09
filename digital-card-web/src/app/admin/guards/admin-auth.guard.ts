import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';

export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.adminMe().pipe(
    map(() => true),
    catchError((err) => {
      if (err?.status === 401) {
        return of(router.createUrlTree(['/login']) as UrlTree);
      }
      return of(router.createUrlTree(['/login']) as UrlTree);
    })
  );
};

