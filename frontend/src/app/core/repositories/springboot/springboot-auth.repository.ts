import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthRepository } from '../auth.repository';
import { User } from '../../models/user.model';
import { StorageService } from '../../services/storage.service';
import { environment } from '../../../../environments/environment';

export interface AuthBackendResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface RefreshBackendResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

@Injectable({ providedIn: 'root' })
export class SpringBootAuthRepository extends AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  getCurrentUser(): Observable<User | null> {
    const accessToken = this.storage.getAccessToken();
    const refreshToken = this.storage.getRefreshToken();

    if (!accessToken && !refreshToken) {
      this.storage.clearAuth();
      return of(null);
    }

    if (accessToken) {
      return this.http.get<User>(`${this.baseUrl}/me`).pipe(
        map(user => {
          this.storage.setAuthenticatedUser(user);
          return user;
        }),
        catchError(err => {
          if (err.status === 401 && refreshToken) {
            // Attempt token refresh
            return this.refreshAccessToken(refreshToken).pipe(
              switchMap(() => this.http.get<User>(`${this.baseUrl}/me`)),
              map(user => {
                this.storage.setAuthenticatedUser(user);
                return user;
              }),
              catchError(() => {
                this.storage.clearAuth();
                return of(null);
              })
            );
          }
          // If offline and we have cached user, return cached user for offline viewing
          if (err.status === 0) {
            const cached = this.storage.getCachedUser();
            return of(cached);
          }
          this.storage.clearAuth();
          return of(null);
        })
      );
    }

    if (refreshToken) {
      return this.refreshAccessToken(refreshToken).pipe(
        switchMap(() => this.http.get<User>(`${this.baseUrl}/me`)),
        map(user => {
          this.storage.setAuthenticatedUser(user);
          return user;
        }),
        catchError(() => {
          this.storage.clearAuth();
          return of(null);
        })
      );
    }

    return of(null);
  }

  refreshAccessToken(refreshToken: string): Observable<string> {
    return this.http.post<RefreshBackendResponse>(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
      map(res => {
        this.storage.setAccessToken(res.accessToken);
        return res.accessToken;
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthBackendResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      map(res => {
        this.storage.setAuthenticatedUser(res.user, res.accessToken, res.refreshToken);
        return res.user;
      }),
      catchError(err => {
        const msg = err.error?.message || err.error || 'Invalid email or password.';
        return throwError(() => new Error(typeof msg === 'string' ? msg : 'Login failed.'));
      })
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.http.post<AuthBackendResponse>(`${this.baseUrl}/register`, { name, email, password }).pipe(
      map(res => {
        this.storage.setAuthenticatedUser(res.user, res.accessToken, res.refreshToken);
        return res.user;
      }),
      catchError(err => {
        const msg = err.error?.message || err.error || 'Registration failed.';
        return throwError(() => new Error(typeof msg === 'string' ? msg : 'Registration failed.'));
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      catchError(() => of(undefined)),
      map(() => {
        this.storage.clearAuth();
        return undefined;
      })
    );
  }

  updateProfile(name: string): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, { name }).pipe(
      map(user => {
        this.storage.setAuthenticatedUser(user);
        return user;
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return of(undefined);
  }

  sendPasswordResetEmail(email: string): Observable<void> {
    return of(undefined);
  }

  loginWithGoogle(): Observable<User> {
    return throwError(() => new Error('OAuth Google login is not configured on this Spring Boot server. Please sign in with email/password.'));
  }

  loginWithGithub(): Observable<User> {
    return throwError(() => new Error('OAuth GitHub login is not configured on this Spring Boot server. Please sign in with email/password.'));
  }
}
