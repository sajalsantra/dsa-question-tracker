import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SettingsRepository } from '../settings.repository';
import { AppSettings, DEFAULT_SETTINGS } from '../../models/settings.model';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class FirebaseSettingsRepository implements SettingsRepository {
  private readonly fb = inject(FirebaseService);

  private get userDocRef() {
    const user = this.fb.auth.currentUser;
    if (!user) return null;
    return doc(this.fb.db, 'users', user.uid, 'appData', 'settings');
  }

  get(): Observable<AppSettings> {
    const ref = this.userDocRef;
    if (!ref) return of(DEFAULT_SETTINGS);

    return from(getDoc(ref)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return (snapshot.data() as AppSettings) || DEFAULT_SETTINGS;
        }
        return DEFAULT_SETTINGS;
      }),
      catchError(() => of(DEFAULT_SETTINGS))
    );
  }

  save(settings: AppSettings): Observable<void> {
    const ref = this.userDocRef;
    if (!ref) return of(undefined);

    return from(setDoc(ref, settings, { merge: true })).pipe(
      map(() => undefined),
      catchError(err => {
        console.warn('Firestore Settings save failed:', err);
        return of(undefined);
      })
    );
  }
}
