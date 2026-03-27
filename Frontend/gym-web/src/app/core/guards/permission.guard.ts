import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TokenService } from '../auth/token.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);

  const decoded = tokenService.getDecodedToken();

  if (!decoded) {
    return router.createUrlTree(['/login']);
  }

  const requiredRole: string | undefined        = route.data['role'];
  const requiredPerms: string | string[] | undefined = route.data['permissions'];

  // No requirements defined on this route → allow
  if (!requiredRole && !requiredPerms) {
    return true;
  }

  // Role check
  if (requiredRole) {
    const userRole = tokenService.getRole();
    if (userRole !== requiredRole) {
      return router.createUrlTree(['/home']);
    }
  }

  // Permissions check — user must hold ALL required permissions
  if (requiredPerms) {
    const required = Array.isArray(requiredPerms) ? requiredPerms : [requiredPerms];
    const userPerms = tokenService.getPermissions();
    const hasAll = required.every(p => userPerms.includes(p));
    if (!hasAll) {
      return router.createUrlTree(['/home']);
    }
  }

  return true;
};
