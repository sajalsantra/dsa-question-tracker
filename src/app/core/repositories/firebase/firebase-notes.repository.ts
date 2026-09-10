import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore';
import { NotesRepository } from '../notes.repository';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class FirebaseNotesRepository implements NotesRepository {
  private readonly fb = inject(FirebaseService);

  private get userDocRef() {
    const user = this.fb.auth.currentUser;
    if (!user) return null;
    return doc(this.fb.db, 'users', user.uid, 'appData', 'notes');
  }

  getAll(): Observable<Record<number, string>> {
    const ref = this.userDocRef;
    if (!ref) return of({});

    return from(getDoc(ref)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return (snapshot.data() as Record<number, string>) || {};
        }
        return {};
      }),
      catchError(err => {
        console.warn('Firestore Notes fetch failed:', err);
        return of({});
      })
    );
  }

  save(questionId: number, notes: string): Observable<void> {
    const ref = this.userDocRef;
    if (!ref) return of(undefined);

    return from(setDoc(ref, { [questionId]: notes }, { merge: true })).pipe(
      map(() => undefined),
      catchError(err => {
        console.warn('Firestore Notes save failed:', err);
        return of(undefined);
      })
    );
  }

  delete(questionId: number): Observable<void> {
    const ref = this.userDocRef;
    if (!ref) return of(undefined);

    return from(setDoc(ref, { [questionId]: deleteField() }, { merge: true })).pipe(
      map(() => undefined),
      catchError(err => {
        console.warn('Firestore Notes delete failed:', err);
        return of(undefined);
      })
    );
  }

  reset(): Observable<void> {
    const ref = this.userDocRef;
    if (!ref) return of(undefined);

    return from(setDoc(ref, {})).pipe(
      map(() => undefined),
      catchError(err => {
        console.warn('Firestore Notes reset failed:', err);
        return of(undefined);
      })
    );
  }
}
