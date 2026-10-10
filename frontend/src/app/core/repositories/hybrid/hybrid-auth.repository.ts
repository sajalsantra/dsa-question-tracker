import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../auth.repository';
import { User } from '../../models/user.model';
import { SpringBootAuthRepository } from '../springboot/springboot-auth.repository';
import { LocalAuthRepository } from '../local/local-auth.repository';

@Injectable({ providedIn: 'root' })
export class HybridAuthRepository implements AuthRepository {
  private readonly sbAuth = inject(SpringBootAuthRepository);
  private readonly localAuth = inject(LocalAuthRepository);

  getCurrentUser(): Observable<User | null> {
    return this.sbAuth.getCurrentUser();
  }

  login(email: string, password: string): Observable<User> {
    return this.sbAuth.login(email, password);
  }

  loginWithGoogle(): Observable<User> {
    return this.sbAuth.loginWithGoogle();
  }

  loginWithGithub(): Observable<User> {
    return this.sbAuth.loginWithGithub();
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.sbAuth.register(name, email, password);
  }

  logout(): Observable<void> {
    return this.sbAuth.logout();
  }

  sendPasswordResetEmail(email: string): Observable<void> {
    return this.sbAuth.sendPasswordResetEmail(email);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.sbAuth.changePassword(currentPassword, newPassword);
  }

  updateProfile(name: string): Observable<User> {
    return this.sbAuth.updateProfile(name);
  }
}
