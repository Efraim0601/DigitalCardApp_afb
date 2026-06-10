import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';

export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.adminMe().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
