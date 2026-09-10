import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">⚙️ Settings</h1>
        <p class="page-sub">Configure application theme, account, and UI preferences</p>
      </div>

      <div class="settings-stack">

        <!-- Theme card -->
        <div class="card">
          <div class="card-title">🎨 Color Theme</div>
          <div class="theme-row">
            <button
              class="theme-option"
              [class.active]="settingsService.settings().theme === 'dark'"
              (click)="settingsService.setTheme('dark')"
            >
              🌙 Dark Mode (Default)
            </button>
            <button
              class="theme-option"
              [class.active]="settingsService.settings().theme === 'light'"
              (click)="settingsService.setTheme('light')"
            >
              ☀️ Light Mode
            </button>
          </div>
        </div>

        <!-- Account Profile Card -->
        <div class="card">
          <div class="card-title">👤 Account Profile</div>
          @if (authService.isAuthenticated()) {
            <div class="user-info">
              <div>
                <div class="u-name">{{ authService.currentUser()?.name }}</div>
                <div class="u-email">{{ authService.currentUser()?.email }}</div>
              </div>
              <button class="btn-logout" (click)="authService.logout()">Sign Out</button>
            </div>
          } @else {
            <p class="auth-hint">You are currently using local offline mode. Sign in to sync state across devices.</p>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text); }
    .page-sub { font-size: 13px; color: var(--text-dim); margin-top: 4px; }

    .settings-stack { display: flex; flex-direction: column; gap: 16px; max-width: 600px; }
    .card { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 14px; }

    .theme-row { display: flex; gap: 12px; }
    .theme-option {
      flex: 1; padding: 12px; border-radius: 10px; border: 1px solid var(--border);
      background: var(--bg-3); color: var(--text); font-size: 13px; font-weight: 600;
    }
    .theme-option.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }

    .user-info { display: flex; align-items: center; justify-content: space-between; }
    .u-name { font-size: 14px; font-weight: 700; color: var(--text); }
    .u-email { font-size: 12px; color: var(--text-dim); }
    .btn-logout { padding: 6px 12px; border-radius: 8px; border: none; background: var(--red); color: #fff; font-size: 12px; font-weight: 600; }

    .auth-hint { font-size: 13px; color: var(--text-dim); }
  `]
})
export class SettingsComponent {
  readonly settingsService = inject(SettingsService);
  readonly authService = inject(AuthService);
}
