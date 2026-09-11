import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppSettings, DEFAULT_SETTINGS } from '../../models/settings.model';
import { SettingsRepository } from '../settings.repository';

const KEY = 'dsaSettings';

@Injectable({ providedIn: 'root' })
export class LocalSettingsRepository extends SettingsRepository {

  get(): Observable<AppSettings> {
    return of(this.load());
  }

  save(settings: AppSettings): Observable<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
    return of(void 0);
  }

  private load(): AppSettings {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT_SETTINGS, ui: { ...DEFAULT_SETTINGS.ui } };
      const stored = JSON.parse(raw) as Partial<AppSettings>;
      return {
        theme: stored.theme ?? DEFAULT_SETTINGS.theme,
        ui: { ...DEFAULT_SETTINGS.ui, ...(stored.ui ?? {}) }
      };
    } catch {
      return { ...DEFAULT_SETTINGS, ui: { ...DEFAULT_SETTINGS.ui } };
    }
  }
}
