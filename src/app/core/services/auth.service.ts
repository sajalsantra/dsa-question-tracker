import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthRepository } from '../repositories/auth.repository';
import { ProgressService } from './progress.service';
import { NotesService } from './notes.service';
import { ActivityService } from './activity.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repo = inject(AuthRepository);
  private readonly injector = inject(Injector);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  load(): void {
    this.repo.getCurrentUser().subscribe(user => {
      this._currentUser.set(user);
      this.refreshServices();
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

  login(email: string, password: string): Observable<User> {
    return this.repo.login(email, password).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.refreshServices();
      })
    );
  }

  loginWithGoogle(): Observable<User> {
    if ('loginWithGoogle' in this.repo) {
      return (this.repo as any).loginWithGoogle().pipe(
        tap((user: User) => {
          this._currentUser.set(user);
          this.refreshServices();
        })
      );
    }
    return this.login('google@user.com', 'pass');
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.repo.register(name, email, password).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.refreshServices();
      })
    );
  }

  logout(): Observable<void> {
    return this.repo.logout().pipe(
      tap(() => {
        this._currentUser.set(null);
        this.refreshServices();
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.repo.changePassword(currentPassword, newPassword);
  }
}
