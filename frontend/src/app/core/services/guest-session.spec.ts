import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { GuestAuthPopupService } from './guest-auth-popup.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { authGuard } from '../guards/auth.guard';
import { User } from '../models/user.model';
import { of } from 'rxjs';

describe('Guest Session Management & Login/Register Popup Validation', () => {
  let storageService: StorageService;
  let popupService: GuestAuthPopupService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Clear browser cookies and localStorage before each test
    document.cookie = 'dsa_browser_session_active=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    localStorage.clear();
    sessionStorage.clear();

    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'currentUser']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        GuestAuthPopupService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    storageService = TestBed.inject(StorageService);
    popupService = TestBed.inject(GuestAuthPopupService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'dsa_browser_session_active=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
  });

  describe('1. Guest Session Lifecycle & Persistence', () => {
    it('Scenario 1: Refresh the page (F5) - guest progress remains intact', () => {
      // Guest sets progress
      storageService.setData('progress', { 1: { questionId: 1, status: 'Solved' } });
      expect(storageService.getData('progress')).toEqual({ 1: { questionId: 1, status: 'Solved' } });

      // Simulating page refresh: new StorageService instance is instantiated with existing session cookie
      // Cookie is active
      expect(document.cookie).toContain('dsa_browser_session_active=1');

      const reloadedStorage = new StorageService();
      const reloadedProgress = reloadedStorage.getData('progress');
      expect(reloadedProgress).toEqual({ 1: { questionId: 1, status: 'Solved' } });
    });

    it('Scenario 2: Close one tab - guest data is not cleared', () => {
      storageService.setData('progress', { 42: { questionId: 42, status: 'Mastered' } });
      storageService.setData('notes', { 42: 'Binary search tip' });

      // Simulating closing tab: beforeunload fires for tab dismissal
      const pageHideEvent = new Event('pagehide');
      window.dispatchEvent(pageHideEvent);

      // Verify guest data is NOT cleared
      expect(storageService.getData('progress')).toEqual({ 42: { questionId: 42, status: 'Mastered' } });
      expect(storageService.getData('notes')).toEqual({ 42: 'Binary search tip' });
    });

    it('Scenario 3: Open multiple tabs - guest data remains consistent', () => {
      // Tab 1 sets progress
      storageService.setData('progress', { 101: { questionId: 101, status: 'Solved' } });

      // Tab 2 opens within same browser session
      const tab2Storage = new StorageService();
      expect(tab2Storage.getData('progress')).toEqual({ 101: { questionId: 101, status: 'Solved' } });

      // Tab 2 updates note
      tab2Storage.setData('notes', { 101: 'Dynamic programming memo' });
      expect(storageService.getData('notes')).toEqual({ 101: 'Dynamic programming memo' });
    });

    it('Scenario 4: Fully close and reopen Chrome - transient guest data is cleared on new browser session', () => {
      // Guest worked on questions in browser session 1
      storageService.setData('progress', { 5: { questionId: 5, status: 'Solved' } });
      storageService.setData('notes', { 5: 'Important note' });
      expect(storageService.getData('progress')).toBeTruthy();

      // Browser process terminates: all session cookies are purged by Chrome
      document.cookie = 'dsa_browser_session_active=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

      // User reopens Chrome and visits the site: new StorageService initializes without session cookie
      const freshBrowserSessionStorage = new StorageService();

      // Transient guest data should be cleared on new browser session
      expect(freshBrowserSessionStorage.getData('progress')).toBeNull();
      expect(freshBrowserSessionStorage.getData('notes')).toBeNull();
    });

    it('Scenario 9: Existing authenticated user data remains untouched throughout guest cleanup', () => {
      // Simulate existing authenticated user data in localStorage
      const authUser: User = { id: 'user-777', name: 'Alice Doe', email: 'alice@example.com' };
      localStorage.setItem('dsa_auth_user', JSON.stringify(authUser));
      localStorage.setItem('dsa_auth_access_token', 'jwt-token-xyz');
      localStorage.setItem('dsa_auth_refresh_token', 'refresh-token-xyz');
      localStorage.setItem('dsa_user_user-777_progress', JSON.stringify({ 1: { questionId: 1, status: 'Mastered' } }));
      localStorage.setItem('dsa_user_user-777_notes', JSON.stringify({ 1: 'Alice secret notes' }));

      // Also set some transient guest data
      localStorage.setItem('dsa_guest_progress', JSON.stringify({ 99: { questionId: 99 } }));

      // Initializing storage for authenticated user
      const authStorage = new StorageService();
      expect(authStorage.isGuest()).toBeFalse();

      // Attempt guest cleanup
      authStorage.clearGuestData();

      // Authenticated user data must be 100% intact!
      expect(localStorage.getItem('dsa_auth_user')).toContain('Alice Doe');
      expect(localStorage.getItem('dsa_auth_access_token')).toBe('jwt-token-xyz');
      expect(localStorage.getItem('dsa_auth_refresh_token')).toBe('refresh-token-xyz');
      expect(localStorage.getItem('dsa_user_user-777_progress')).toContain('Mastered');
      expect(localStorage.getItem('dsa_user_user-777_notes')).toContain('Alice secret notes');
    });
  });

  describe('2. Login/Register Popup & Guard Validation', () => {
    it('Scenario 5: Log in or register - navigate to correct pages', () => {
      popupService.open({ feature: 'Settings' });
      expect(popupService.isOpen()).toBeTrue();

      // Click Log In
      popupService.navigateToLogin();
      expect(popupService.isOpen()).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);

      // Open and click Register
      popupService.open({ feature: 'Settings' });
      popupService.navigateToRegister();
      expect(popupService.isOpen()).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('Scenario 6: Authenticated user accesses a protected feature - no popup appears', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      popupService.open({ feature: 'Settings' });
      expect(popupService.isOpen()).toBeFalse(); // Refused because user is authenticated

      // Test authGuard directly for authenticated user
      const result = TestBed.runInInjectionContext(() => {
        return authGuard({ data: { title: 'Settings' } } as any, {} as any);
      });
      expect(result).toBeTrue();
      expect(popupService.isOpen()).toBeFalse();
    });

    it('Scenario 7: Guest accesses a protected feature - popup appears and navigation is blocked', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      // Guest attempts to activate protected route via authGuard
      const result = TestBed.runInInjectionContext(() => {
        return authGuard({ data: { title: 'Settings' } } as any, {} as any);
      });

      // Navigation blocked to stay on current page
      expect(result).toBeFalse();
      // Popup opened with clear message
      expect(popupService.isOpen()).toBeTrue();
      expect(popupService.message()).toContain('Settings');
    });

    it('Scenario 8: Close popup (×) - guest can dismiss and continue browsing', () => {
      popupService.open({ feature: 'Settings' });
      expect(popupService.isOpen()).toBeTrue();

      popupService.close();
      expect(popupService.isOpen()).toBeFalse();
      // Router navigate was NOT called, guest remains on current page
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});
