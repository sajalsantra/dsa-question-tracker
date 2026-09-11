import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export abstract class AuthRepository {
  abstract getCurrentUser(): Observable<User | null>;
  abstract login(email: string, password: string): Observable<User>;
  abstract register(name: string, email: string, password: string): Observable<User>;
  abstract logout(): Observable<void>;
  abstract changePassword(currentPassword: string, newPassword: string): Observable<void>;
  abstract sendPasswordResetEmail?(email: string): Observable<void>;
  abstract loginWithGoogle?(): Observable<User>;
  abstract loginWithGithub?(): Observable<User>;
}
