import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppSettings, DEFAULT_SETTINGS } from '../../models/settings.model';
import { SettingsRepository } from '../settings.repository';
import { StorageService } from '../../services/storage.service';

@Injectable({ providedIn: 'root' })
export class LocalSettingsRepository extends SettingsRepository {
  private readonly storage = inject(StorageService);

  get(): Observable<AppSettings> {
    return of(this.load());
  }

  save(settings: AppSettings): Observable<void> {
    this.storage.setData('settings', settings);
    return of(void 0);
  }

  private load(): AppSettings {
    try {
      const stored = this.storage.getData<Partial<AppSettings>>('settings');
      if (!stored) return { ...DEFAULT_SETTINGS, ui: { ...DEFAULT_SETTINGS.ui } };
      return {
        theme: stored.theme ?? DEFAULT_SETTINGS.theme,
        geminiApiKey: stored.geminiApiKey ?? DEFAULT_SETTINGS.geminiApiKey,
        openAiApiKey: stored.openAiApiKey ?? DEFAULT_SETTINGS.openAiApiKey,
        aiProvider: stored.aiProvider ?? DEFAULT_SETTINGS.aiProvider,
        enableCloudSync: stored.enableCloudSync ?? DEFAULT_SETTINGS.enableCloudSync,
        ui: { ...DEFAULT_SETTINGS.ui, ...(stored.ui ?? {}) }
      };
    } catch {
      return { ...DEFAULT_SETTINGS, ui: { ...DEFAULT_SETTINGS.ui } };
    }
  }
}
