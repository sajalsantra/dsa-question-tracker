import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthRepository } from '../repositories/auth.repository';
import { ProgressRepository } from '../repositories/progress.repository';
import { NotesRepository } from '../repositories/notes.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { ProgressService } from './progress.service';
import { NotesService } from './notes.service';
import { ActivityService } from './activity.service';
import { SettingsService } from './settings.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repo = inject(AuthRepository);
  private readonly storage = inject(StorageService);
  private readonly injector = inject(Injector);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isVerifying = signal<boolean>(false);

  readonly displayName = computed(() => {
    const user = this._currentUser();
    if (!user) return 'Guest';
    if (user.name && user.name.trim().length > 0) {
      return user.name.trim();
    }
    if (user.email && user.email.includes('@')) {
      return user.email.split('@')[0];
    }
    return user.email || 'User';
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.isAuthenticated()) {
          this.syncLocalRepositories();
        }
      });
    }
  }

  load(): void {
    this.isVerifying.set(true);
    this.repo.getCurrentUser().subscribe({
      next: user => {
        this._currentUser.set(user);
        this.isVerifying.set(false);
        this.refreshServices();
        if (user) {
          this.syncLocalRepositories();
        }
      },
      error: () => {
        this._currentUser.set(null);
        this.isVerifying.set(false);
        this.refreshServices();
      }
    });
  }

  private refreshServices(): void {
    try {
      this.injector.get(ProgressService, null, { optional: true })?.load();
      this.injector.get(NotesService, null, { optional: true })?.load();
      this.injector.get(ActivityService, null, { optional: true })?.load();
      this.injector.get(SettingsService, null, { optional: true })?.load();
    } catch {
      // Ignore during DI bootstrapping
    }
  }

  syncLocalRepositories(): void {
    try {
      this.injector.get(ProgressRepository, null, { optional: true })?.syncLocalToRemote?.()?.subscribe();
      this.injector.get(NotesRepository, null, { optional: true })?.syncLocalToRemote?.()?.subscribe();
      this.injector.get(ActivityRepository, null, { optional: true })?.syncLocalToRemote?.()?.subscribe();
      this.injector.get(SettingsRepository, null, { optional: true })?.syncLocalToRemote?.()?.subscribe();
    } catch {
      // Ignore during DI bootstrapping
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.repo.login(email, password).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.refreshServices();
        this.syncLocalRepositories();
      })
    );
  }

  loginWithGoogle(): Observable<User> {
    if ('loginWithGoogle' in this.repo && typeof (this.repo as any).loginWithGoogle === 'function') {
      return (this.repo as any).loginWithGoogle().pipe(
        tap((user: User) => {
          this._currentUser.set(user);
          this.refreshServices();
          this.syncLocalRepositories();
        })
      );
    }
    return of({ id: 'guest', name: 'Guest', email: 'guest@example.com' });
  }

  loginWithGithub(): Observable<User> {
    if ('loginWithGithub' in this.repo && typeof (this.repo as any).loginWithGithub === 'function') {
      return (this.repo as any).loginWithGithub().pipe(
        tap((user: User) => {
          this._currentUser.set(user);
          this.refreshServices();
          this.syncLocalRepositories();
        })
      );
    }
    return of({ id: 'guest', name: 'Guest', email: 'guest@example.com' });
  }

  register(name: string, email: string, password: string, syncGuestData: boolean = true): Observable<User> {
    // Capture guest state snapshot prior to switching active session
    const guestSnapshot = syncGuestData ? this.storage.getGuestSnapshot() : null;

    return this.repo.register(name, email, password).pipe(
      tap(user => {
        this._currentUser.set(user);

        if (syncGuestData && guestSnapshot) {
          // Transfer guest snapshot to the authenticated account cache
          if (guestSnapshot.progress && Object.keys(guestSnapshot.progress).length > 0) {
            this.storage.setData('progress', guestSnapshot.progress);
          }
          if (guestSnapshot.notes && Object.keys(guestSnapshot.notes).length > 0) {
            this.storage.setData('notes', guestSnapshot.notes);
          }
          if (guestSnapshot.activity && Object.keys(guestSnapshot.activity).length > 0) {
            this.storage.setData('activity', guestSnapshot.activity);
          }
          if (guestSnapshot.goal) {
            this.storage.setData('goal', guestSnapshot.goal);
          }
          if (guestSnapshot.settings) {
            this.storage.setData('settings', guestSnapshot.settings);
          }

          // Clear guest sessionStorage so guest state doesn't linger
          this.storage.clearGuestData();

          // Push transferred items up to MySQL
          this.syncLocalRepositories();
        } else {
          // Discard guest data
          this.storage.clearGuestData();
        }

        this.refreshServices();
      })
    );
  }

  logout(): Observable<void> {
    return this.repo.logout().pipe(
      tap(() => {
        this.storage.clearAuth();
        this._currentUser.set(null);
        this.refreshServices();
      }),
      catchError(() => {
        this.storage.clearAuth();
        this._currentUser.set(null);
        this.refreshServices();
        return of(undefined);
      })
    );
  }

  sendPasswordResetEmail(email: string): Observable<void> {
    if ('sendPasswordResetEmail' in this.repo && typeof (this.repo as any).sendPasswordResetEmail === 'function') {
      return (this.repo as any).sendPasswordResetEmail(email);
    }
    return of(undefined);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.repo.changePassword(currentPassword, newPassword);
  }

  updateProfileName(name: string): Observable<User> {
    if (this.repo.updateProfile && typeof this.repo.updateProfile === 'function') {
      return this.repo.updateProfile(name).pipe(
        tap((updated: User) => {
          this._currentUser.set(updated);
          this.storage.setAuthenticatedUser(updated);
        })
      );
    }
    const current = this._currentUser();
    const updated: User = { id: current?.id || '', name, email: current?.email || '' };
    this._currentUser.set(updated);
    this.storage.setAuthenticatedUser(updated);
    return of(updated);
  }

  validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one capital letter (A-Z).' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&* etc.).' };
    }
    return { valid: true };
  }
}
