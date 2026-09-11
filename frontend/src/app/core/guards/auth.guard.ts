import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthModalService } from '../services/auth-modal.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const authModalService = inject(AuthModalService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Open Auth Modal and redirect to dashboard
  authModalService.open('signin');
  return router.createUrlTree(['/dashboard']);
};

