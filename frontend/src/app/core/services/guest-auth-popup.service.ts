import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export interface GuestPopupOptions {
  feature?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuestAuthPopupService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isOpen = signal<boolean>(false);
  readonly featureName = signal<string | null>(null);
  readonly message = signal<string>(
    'Sign in or register to access this feature, preserve your progress permanently, and sync notes across devices.'
  );

  /**
   * Opens the Guest Authentication Popup if the user is not authenticated.
   * Prevents duplicate popups.
   */
  open(options?: GuestPopupOptions): void {
    // 1. Do not display popup to authenticated users
    if (this.authService.isAuthenticated()) {
      return;
    }

    // 2. Prevent duplicate popups
    if (this.isOpen()) {
      return;
    }

    if (options?.message) {
      this.message.set(options.message);
    } else if (options?.feature) {
      this.message.set(
        `You need to be signed in to access ${options.feature}. Log in or create an account to sync progress and customize settings.`
      );
    } else {
      this.message.set(
        'Sign in or register to access this feature, preserve your progress permanently, and sync notes across devices.'
      );
    }

    this.featureName.set(options?.feature || null);
    this.isOpen.set(true);
  }

  /**
   * Dismisses the popup, allowing the guest user to continue browsing.
   */
  close(): void {
    this.isOpen.set(false);
  }

  /**
   * Navigates to the existing Login page and dismisses the popup.
   */
  navigateToLogin(): void {
    this.close();
    this.router.navigate(['/login']);
  }

  /**
   * Navigates to the existing Registration page and dismisses the popup.
   */
  navigateToRegister(): void {
    this.close();
    this.router.navigate(['/register']);
  }
}
