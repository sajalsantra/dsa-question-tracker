import { Injectable, signal, inject } from '@angular/core';
import { AppSettings, DEFAULT_SETTINGS } from '../models/settings.model';
import { SettingsRepository } from '../repositories/settings.repository';
import { LocalSettingsRepository } from '../repositories/local/local-settings.repository';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly repo = inject(SettingsRepository);
  private readonly document = inject(DOCUMENT);

  private readonly _settings = signal<AppSettings>({
    ...DEFAULT_SETTINGS,
    ui: { ...DEFAULT_SETTINGS.ui }
  });
  readonly settings = this._settings.asReadonly();

  load(): void {
    this.repo.get().subscribe(s => {
      const merged: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...(s || {}),
        openAiApiKey: (s && s.openAiApiKey) ? s.openAiApiKey : DEFAULT_SETTINGS.openAiApiKey,
        geminiApiKey: (s && s.geminiApiKey) ? s.geminiApiKey : DEFAULT_SETTINGS.geminiApiKey,
        aiProvider: (s && s.aiProvider) ? s.aiProvider : DEFAULT_SETTINGS.aiProvider,
        ui: { ...DEFAULT_SETTINGS.ui, ...((s && s.ui) || {}) }
      };
      this._settings.set(merged);
      this.applyTheme(merged.theme);
    });
  }

  setTheme(theme: 'dark' | 'light'): void {
    this._settings.update(s => ({ ...s, theme }));
    this.applyTheme(theme);
    this.persist();
  }

  toggleTheme(): void {
    const current = this._settings().theme;
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  toggleSection(key: keyof AppSettings['ui']): void {
    this._settings.update(s => ({
      ...s,
      ui: { ...s.ui, [key]: !s.ui[key] }
    }));
    this.persist();
  }

  setAiApiKey(geminiApiKey: string): void {
    this._settings.update(s => ({ ...s, geminiApiKey }));
    this.persist();
  }

  setOpenAiApiKey(openAiApiKey: string): void {
    this._settings.update(s => ({ ...s, openAiApiKey }));
    this.persist();
  }

  setAiProvider(aiProvider: 'gemini' | 'openai'): void {
    this._settings.update(s => ({ ...s, aiProvider }));
    this.persist();
  }

  private applyTheme(theme: 'dark' | 'light'): void {
    const root = this.document.documentElement;
    const body = this.document.body;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
    }
  }

  private persist(): void {
    this.repo.save(this._settings()).subscribe();
  }
}
