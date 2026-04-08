import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../auth/token.service';

export const publicGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);

  if (tokenService.isAuthenticated()) {
    const role = tokenService.getRole();
    return router.createUrlTree(role === 'ADMIN' ? ['/admin/dashboard'] : ['/home']);
  }

  return true;
};
