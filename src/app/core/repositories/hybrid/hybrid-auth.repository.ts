import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRepository } from '../auth.repository';
import { User } from '../../models/user.model';
import { FirebaseAuthRepository } from '../firebase/firebase-auth.repository';
import { LocalAuthRepository } from '../local/local-auth.repository';

@Injectable({ providedIn: 'root' })
export class HybridAuthRepository implements AuthRepository {
  private readonly fbAuth = inject(FirebaseAuthRepository);
  private readonly localAuth = inject(LocalAuthRepository);

  getCurrentUser(): Observable<User | null> {
    return this.fbAuth.getCurrentUser().pipe(
      tap(user => {
        if (user) {
          localStorage.setItem('dsa_tracker_user', JSON.stringify(user));
        } else {
          // Fall back to local auth if offline or guest
        }
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    return this.fbAuth.login(email, password).pipe(
      tap(user => localStorage.setItem('dsa_tracker_user', JSON.stringify(user)))
    );
  }

  loginWithGoogle(): Observable<User> {
    return this.fbAuth.loginWithGoogle().pipe(
      tap(user => localStorage.setItem('dsa_tracker_user', JSON.stringify(user)))
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.fbAuth.register(name, email, password).pipe(
      tap(user => localStorage.setItem('dsa_tracker_user', JSON.stringify(user)))
    );
  }

  logout(): Observable<void> {
    localStorage.removeItem('dsa_tracker_user');
    return this.fbAuth.logout();
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.fbAuth.changePassword(currentPassword, newPassword);
  }
}
