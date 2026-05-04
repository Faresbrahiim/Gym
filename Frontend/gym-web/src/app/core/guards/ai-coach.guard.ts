import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TokenService } from '../auth/token.service';
import { MembershipEntitlementsService } from '../../features/membership/services/membership-entitlements.service';

export const aiCoachGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const entitlementsService = inject(MembershipEntitlementsService);

  if (!tokenService.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (tokenService.getRole() !== 'MEMBER') {
    return router.createUrlTree(['/not-found']);
  }

  return entitlementsService.load().pipe(
    map(entitlements => entitlements.aiCoachAllowed
      ? true
      : router.createUrlTree(['/membership/plans'])
    ),
    catchError(() => of(router.createUrlTree(['/membership/plans'])))
  );
};
