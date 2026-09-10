import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
      local$.pipe(
        tap(localNotes => {
          this.fbRepo.getAll().pipe(
            tap(remoteNotes => {
              const allIds = new Set([
                ...Object.keys(localNotes || {}).map(Number),
                ...Object.keys(remoteNotes || {}).map(Number)
              ]);

              for (const id of allIds) {
                const local = localNotes?.[id];
                const remote = remoteNotes?.[id];

                if (local !== undefined && remote === undefined) {
                  this.fbRepo.save(id, local).subscribe();
                } else if (remote !== undefined && local === undefined) {
                  this.localRepo.save(id, remote).subscribe();
                } else if (remote !== undefined && local !== undefined) {
                  // Prefer remote note if non-empty, otherwise local
                  if (!local && remote) {
                    this.localRepo.save(id, remote).subscribe();
                  } else if (local && !remote) {
                    this.fbRepo.save(id, local).subscribe();
                  }
                }
              }
            }),
            catchError(() => of({}))
          ).subscribe();
        })
      ).subscribe();
    }

    return local$;
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
