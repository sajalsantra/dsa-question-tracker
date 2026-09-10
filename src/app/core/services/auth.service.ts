import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthRepository } from '../repositories/auth.repository';
import { LocalAuthRepository } from '../repositories/local/local-auth.repository';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repo: AuthRepository = inject(LocalAuthRepository);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  load(): void {
    this.repo.getCurrentUser().subscribe(user => this._currentUser.set(user));
  }

  login(email: string, password: string): Observable<User> {
    return this.repo.login(email, password).pipe(
      tap(user => this._currentUser.set(user))
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.repo.register(name, email, password).pipe(
      tap(user => this._currentUser.set(user))
    );
  }

  logout(): Observable<void> {
    return this.repo.logout().pipe(
      tap(() => this._currentUser.set(null))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.repo.changePassword(currentPassword, newPassword);
  }
}
