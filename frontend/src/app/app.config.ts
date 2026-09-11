import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';

import { AuthRepository } from './core/repositories/auth.repository';
import { ProgressRepository } from './core/repositories/progress.repository';
import { NotesRepository } from './core/repositories/notes.repository';
import { ActivityRepository } from './core/repositories/activity.repository';
import { SettingsRepository } from './core/repositories/settings.repository';

import { HybridAuthRepository } from './core/repositories/hybrid/hybrid-auth.repository';
import { HybridProgressRepository } from './core/repositories/hybrid/hybrid-progress.repository';
import { HybridNotesRepository } from './core/repositories/hybrid/hybrid-notes.repository';
import { HybridActivityRepository } from './core/repositories/hybrid/hybrid-activity.repository';
import { HybridSettingsRepository } from './core/repositories/hybrid/hybrid-settings.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideAnimations(),
    provideCharts(withDefaultRegisterables()),
    { provide: AuthRepository, useClass: HybridAuthRepository },
    { provide: ProgressRepository, useClass: HybridProgressRepository },
    { provide: NotesRepository, useClass: HybridNotesRepository },
    { provide: ActivityRepository, useClass: HybridActivityRepository },
    { provide: SettingsRepository, useClass: HybridSettingsRepository }
  ]
};
