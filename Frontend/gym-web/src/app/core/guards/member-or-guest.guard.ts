import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../auth/token.service';

export const memberOrGuestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.isAuthenticated()) {
    return true;
  }

  if (tokenService.getRole() === 'MEMBER') {
    return true;
  }

  return router.createUrlTree(['/not-found']);
};
