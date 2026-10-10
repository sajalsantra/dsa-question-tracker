import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SettingsRepository } from '../settings.repository';
import { AppSettings, DEFAULT_SETTINGS } from '../../models/settings.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpringBootSettingsRepository extends SettingsRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  get(): Observable<AppSettings> {
    return this.http.get<any>(this.baseUrl).pipe(
      map(res => {
        if (!res) return DEFAULT_SETTINGS;
        return {
          ...DEFAULT_SETTINGS,
          theme: (res.theme === 'light' || res.theme === 'dark') ? res.theme : DEFAULT_SETTINGS.theme,
          enableCloudSync: res.enableCloudSync ?? DEFAULT_SETTINGS.enableCloudSync,
          ui: { ...DEFAULT_SETTINGS.ui }
        };
      }),
      catchError(() => of(DEFAULT_SETTINGS))
    );
  }

  save(settings: AppSettings): Observable<void> {
    const payload = {
      theme: settings.theme,
      enableCloudSync: settings.enableCloudSync
    };
    return this.http.post<void>(this.baseUrl, payload).pipe(
      catchError(() => of(undefined))
    );
  }
}
