import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, startWith } from 'rxjs/operators';
import { SettingsRepository } from '../settings.repository';
import { AppSettings, DEFAULT_SETTINGS } from '../../models/settings.model';
import { LocalSettingsRepository } from '../local/local-settings.repository';
import { FirebaseSettingsRepository } from '../firebase/firebase-settings.repository';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class HybridSettingsRepository implements SettingsRepository {
  private readonly localRepo = inject(LocalSettingsRepository);
  private readonly fbRepo = inject(FirebaseSettingsRepository);
  private readonly fb = inject(FirebaseService);

  get(): Observable<AppSettings> {
    const local$ = this.localRepo.get();

    if (this.fb.auth.currentUser) {
      return local$.pipe(
        switchMap(localData =>
          this.fbRepo.get().pipe(
            map(remoteSettings => {
              if (remoteSettings) {
                this.localRepo.save(remoteSettings).subscribe();
                return remoteSettings;
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

  save(settings: AppSettings): Observable<void> {
    this.localRepo.save(settings).subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.save(settings);
    }
    return of(undefined);
  }

  syncLocalToRemote(): Observable<void> {
    if (!this.fb.auth.currentUser) return of(undefined);

    this.localRepo.get().pipe(
      tap(localSettings => {
        if (localSettings) {
          this.fbRepo.save(localSettings).subscribe();
        }
      }),
      catchError(() => of(DEFAULT_SETTINGS))
    ).subscribe();

    return of(undefined);
  }
}
