import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
      this.fbRepo.get().pipe(
        tap(remoteSettings => {
          if (remoteSettings) {
            this.localRepo.save(remoteSettings).subscribe();
          }
        }),
        catchError(() => of(DEFAULT_SETTINGS))
      ).subscribe();
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
}
