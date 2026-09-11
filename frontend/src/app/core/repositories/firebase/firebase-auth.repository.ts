import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { AuthRepository } from '../auth.repository';
import { User } from '../../models/user.model';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthRepository implements AuthRepository {
  private readonly fb = inject(FirebaseService);

  getCurrentUser(): Observable<User | null> {
    return new Observable(subscriber => {
      const unsubscribe = onAuthStateChanged(this.fb.auth, user => {
        if (user) {
          subscriber.next({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || ''
          });
        } else {
          subscriber.next(null);
        }
      });
      return () => unsubscribe();
    });
  }

  login(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(this.fb.auth, email, password)).pipe(
      map(cred => ({
        id: cred.user.uid,
        name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
        email: cred.user.email || ''
      }))
    );
  }

  loginWithGoogle(): Observable<User> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.fb.auth, provider)).pipe(
      map(cred => ({
        id: cred.user.uid,
        name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
        email: cred.user.email || ''
      }))
    );
  }

  loginWithGithub(): Observable<User> {
    const provider = new GithubAuthProvider();
    return from(signInWithPopup(this.fb.auth, provider)).pipe(
      map(cred => ({
        id: cred.user.uid,
        name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
        email: cred.user.email || ''
      }))
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    return from(createUserWithEmailAndPassword(this.fb.auth, email, password)).pipe(
      map(cred => ({
        id: cred.user.uid,
        name: name || cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
        email: cred.user.email || ''
      }))
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.fb.auth));
  }

  sendPasswordResetEmail(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.fb.auth, email));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const user = this.fb.auth.currentUser;
    if (!user) return of(undefined);
    return from(updatePassword(user, newPassword));
  }
}
