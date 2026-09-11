import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, startWith } from 'rxjs/operators';
import { NotesRepository } from '../notes.repository';
import { LocalNotesRepository } from '../local/local-notes.repository';
import { FirebaseNotesRepository } from '../firebase/firebase-notes.repository';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class HybridNotesRepository implements NotesRepository {
  private readonly localRepo = inject(LocalNotesRepository);
  private readonly fbRepo = inject(FirebaseNotesRepository);
  private readonly fb = inject(FirebaseService);

  getAll(): Observable<Record<number, string>> {
    const local$ = this.localRepo.getAll();

    if (this.fb.auth.currentUser) {
      return local$.pipe(
        switchMap(localData =>
          this.fbRepo.getAll().pipe(
            map(remoteNotes => {
              if (remoteNotes && Object.keys(remoteNotes).length > 0) {
                for (const [idStr, text] of Object.entries(remoteNotes)) {
                  this.localRepo.save(Number(idStr), text).subscribe();
                }
                return remoteNotes;
              }
              return localData;
            }),
            catchError(() => of(localData)),
            startWith(localData)
          )
        )
      );
    }

    return local$;
  }

  syncLocalToRemote(): Observable<void> {
    if (!this.fb.auth.currentUser) return of(undefined);

    return this.localRepo.getAll().pipe(
      tap(localNotes => {
        if (localNotes && Object.keys(localNotes).length > 0) {
          for (const [idStr, text] of Object.entries(localNotes)) {
            this.fbRepo.save(Number(idStr), text).subscribe();
          }
        }
      }),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  save(questionId: number, notes: string): Observable<void> {
    this.localRepo.save(questionId, notes).subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.save(questionId, notes);
    }
    return of(undefined);
  }

  delete(questionId: number): Observable<void> {
    this.localRepo.delete(questionId).subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.delete(questionId);
    }
    return of(undefined);
  }

  reset(): Observable<void> {
    this.localRepo.reset().subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.reset();
    }
    return of(undefined);
  }
}
