import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GuestAuthPopupService } from '../services/guest-auth-popup.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const guestAuthPopupService = inject(GuestAuthPopupService);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Determine feature name if available from route data
  const featureName = (route.data && route.data['title']) ? route.data['title'] : 'Settings';

  // Trigger Login/Register popup for guest
  guestAuthPopupService.open({
    feature: featureName,
    message: `${featureName} and account preferences require authentication. Log in or create an account to customize your profile, sync data across devices, and manage API keys.`
  });

  // Cancel navigation to leave the guest on their current browsing page
  return false;
};


