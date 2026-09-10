import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore';
import { ProgressRepository } from '../progress.repository';
import { QuestionProgress } from '../../models/progress.model';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class FirebaseProgressRepository implements ProgressRepository {
  private readonly fb = inject(FirebaseService);

  private get userDocRef() {
    const user = this.fb.auth.currentUser;
    if (!user) return null;
    return doc(this.fb.db, 'users', user.uid, 'appData', 'progress');
  }

  getAll(): Observable<Record<number, QuestionProgress>> {
    const ref = this.userDocRef;
    if (!ref) return of({});

    return from(getDoc(ref)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return (snapshot.data() as Record<number, QuestionProgress>) || {};
        }
        return {};
      }),
      catchError(err => {
        console.warn('Firestore Progress fetch failed:', err);
        return of({});
      })
    );
  }

  save(questionId: number, progress: QuestionProgress): Observable<void> {
    const ref = this.userDocRef;
    if (!ref) return of(undefined);

    return from(setDoc(ref, { [questionId]: progress }, { merge: true })).pipe(
      map(() => undefined),
      catchError(err => {
        console.warn('Firestore Progress save failed:', err);
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
        console.warn('Firestore Progress delete failed:', err);
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
        console.warn('Firestore Progress reset failed:', err);
        return of(undefined);
      })
    );
  }
}
