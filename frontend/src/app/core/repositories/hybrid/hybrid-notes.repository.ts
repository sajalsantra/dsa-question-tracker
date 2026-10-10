import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, startWith } from 'rxjs/operators';
import { NotesRepository } from '../notes.repository';
import { LocalNotesRepository } from '../local/local-notes.repository';
import { SpringBootNotesRepository } from '../springboot/springboot-notes.repository';
import { StorageService } from '../../services/storage.service';
import { ApiHealthService } from '../../services/api-health.service';

@Injectable({ providedIn: 'root' })
export class HybridNotesRepository implements NotesRepository {
  private readonly localRepo = inject(LocalNotesRepository);
  private readonly springBootRepo = inject(SpringBootNotesRepository);
  private readonly storage = inject(StorageService);
  private readonly healthService = inject(ApiHealthService);

  getAll(): Observable<Record<number, string>> {
    const local$ = this.localRepo.getAll();

    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return local$.pipe(
        switchMap(localData => {
          if (!this.healthService.isSpringBootOnline()) {
            return of(localData);
          }
          return this.springBootRepo.getAll().pipe(
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
          );
        })
      );
    }

    return local$;
  }

  syncLocalToRemote(): Observable<void> {
    if (this.storage.isGuest() || !this.storage.getAccessToken()) return of(undefined);

    return this.localRepo.getAll().pipe(
      switchMap(localNotes => {
        if (localNotes && Object.keys(localNotes).length > 0) {
          return this.springBootRepo.sync(localNotes).pipe(
            map(() => undefined),
            catchError(() => of(undefined))
          );
        }
        return of(undefined);
      })
    );
  }

  save(questionId: number, notes: string): Observable<void> {
    this.localRepo.save(questionId, notes).subscribe();

    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      if (this.healthService.isSpringBootOnline()) {
        return this.springBootRepo.save(questionId, notes).pipe(
          catchError(() => {
            this.storage.queueOfflineMutation({
              id: `note_${questionId}_${Date.now()}`,
              type: 'NOTE',
              action: 'SAVE',
              payload: { questionId, notes },
              timestamp: new Date().toISOString()
            });
            return of(undefined);
          })
        );
      } else {
        this.storage.queueOfflineMutation({
          id: `note_${questionId}_${Date.now()}`,
          type: 'NOTE',
          action: 'SAVE',
          payload: { questionId, notes },
          timestamp: new Date().toISOString()
        });
      }
    }
    return of(undefined);
  }

  delete(questionId: number): Observable<void> {
    this.localRepo.delete(questionId).subscribe();
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return this.springBootRepo.delete(questionId);
    }
    return of(undefined);
  }

  reset(): Observable<void> {
    this.localRepo.reset().subscribe();
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return this.springBootRepo.reset();
    }
    return of(undefined);
  }
}
