import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../../models/user.model';
import { AuthRepository } from '../auth.repository';

const SESSION_KEY = 'dsaAuthSession';

/**
 * Local mock auth implementation.
 * Stores a demo user in localStorage.
 * Replaced by HttpAuthRepository when Spring Boot + JWT is ready.
 *
 * Password validation: any password >= 6 chars accepted for demo.
 * In production, passwords are verified by the backend only.
 */
@Injectable({ providedIn: 'root' })
export class LocalAuthRepository extends AuthRepository {

  getCurrentUser(): Observable<User | null> {
    return of(this.loadSession());
  }

  login(email: string, password: string): Observable<User> {
    if (!email || password.length < 6) {
      return throwError(() => new Error('Invalid email or password (min 6 chars).'));
    }
    const user: User = {
      id: `local-${btoa(email)}`,
      name: email.split('@')[0].replace(/[._]/g, ' '),
      email
    };
    this.saveSession(user);
    return of(user);
  }

  register(name: string, email: string, password: string): Observable<User> {
    if (!name || !email || password.length < 6) {
      return throwError(() => new Error('Name, email, and password (min 6 chars) are required.'));
    }
    const user: User = {
      id: `local-${btoa(email)}`,
      name,
      email
    };
    this.saveSession(user);
    return of(user);
  }

  logout(): Observable<void> {
    localStorage.removeItem(SESSION_KEY);
    return of(void 0);
  }

  changePassword(_currentPassword: string, newPassword: string): Observable<void> {
    if (newPassword.length < 6) {
      return throwError(() => new Error('New password must be at least 6 characters.'));
    }
    // Local mock — no real password storage
    return of(void 0);
  }

  private loadSession(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveSession(user: User): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to persist auth session:', e);
    }
  }
}
