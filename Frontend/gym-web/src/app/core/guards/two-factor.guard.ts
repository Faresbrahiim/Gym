import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TwoFactorStateService } from '../../features/auth/services/two-factor-state.service';

export const twoFactorGuard: CanActivateFn = () => {
  const twoFactorStateService = inject(TwoFactorStateService);
  const router                = inject(Router);

  if (twoFactorStateService.getPendingUserId()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
