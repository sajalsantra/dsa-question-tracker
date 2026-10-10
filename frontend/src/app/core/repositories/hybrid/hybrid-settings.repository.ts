import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, startWith } from 'rxjs/operators';
import { SettingsRepository } from '../settings.repository';
import { AppSettings, DEFAULT_SETTINGS } from '../../models/settings.model';
import { LocalSettingsRepository } from '../local/local-settings.repository';
import { SpringBootSettingsRepository } from '../springboot/springboot-settings.repository';
import { StorageService } from '../../services/storage.service';
import { ApiHealthService } from '../../services/api-health.service';

@Injectable({ providedIn: 'root' })
export class HybridSettingsRepository implements SettingsRepository {
  private readonly localRepo = inject(LocalSettingsRepository);
  private readonly springBootRepo = inject(SpringBootSettingsRepository);
  private readonly storage = inject(StorageService);
  private readonly healthService = inject(ApiHealthService);

  get(): Observable<AppSettings> {
    const local$ = this.localRepo.get();

    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return local$.pipe(
        switchMap(localData => {
          if (!this.healthService.isSpringBootOnline()) {
            return of(localData);
          }
          return this.springBootRepo.get().pipe(
            map(remoteSettings => {
              if (remoteSettings) {
                this.localRepo.save(remoteSettings).subscribe();
                return remoteSettings;
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

  save(settings: AppSettings): Observable<void> {
    this.localRepo.save(settings).subscribe();
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return this.springBootRepo.save(settings);
    }
    return of(undefined);
  }

  syncLocalToRemote(): Observable<void> {
    if (this.storage.isGuest() || !this.storage.getAccessToken()) return of(undefined);

    this.localRepo.get().pipe(
      switchMap(localSettings => {
        if (localSettings) {
          return this.springBootRepo.save(localSettings);
        }
        return of(undefined);
      }),
      catchError(() => of(undefined))
    ).subscribe();

    return of(undefined);
  }
}
