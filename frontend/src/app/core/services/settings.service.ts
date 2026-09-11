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
      this._settings.set(s);
      this.applyTheme(s.theme);
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
