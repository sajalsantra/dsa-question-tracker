import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">⚙️ Settings</h1>
        <p class="page-sub">Configure application theme, account security, and UI preferences</p>
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

        <!-- Security & Password Card -->
        @if (authService.isAuthenticated()) {
          <div class="card">
            <div class="card-title">🔒 Password & Security</div>

            <div class="security-actions">
              <button class="btn btn-secondary" (click)="sendResetEmail()">
                📧 Send Password Reset Email
              </button>
            </div>

            <div class="divider"><span>OR UPDATE PASSWORD</span></div>

            <form (ngSubmit)="changePassword()" class="pwd-form">
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" [(ngModel)]="currentPassword" name="currentPassword" class="input" placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label>New Password</label>
                <input type="password" [(ngModel)]="newPassword" name="newPassword" class="input" placeholder="••••••••" />
              </div>
              <button type="submit" class="btn btn-primary">Update Password</button>
            </form>
          </div>
        }

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
      background: var(--bg-3); color: var(--text); font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .theme-option.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }

    .user-info { display: flex; align-items: center; justify-content: space-between; }
    .u-name { font-size: 14px; font-weight: 700; color: var(--text); }
    .u-email { font-size: 12px; color: var(--text-dim); }
    .btn-logout { padding: 6px 12px; border-radius: 8px; border: none; background: var(--red); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }

    .auth-hint { font-size: 13px; color: var(--text-dim); }

    .security-actions { margin-bottom: 16px; }
    .divider {
      display: flex; align-items: center; text-align: center; margin: 16px 0; color: var(--text-dim); font-size: 10px; font-weight: 600;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; border-bottom: 1px solid var(--border);
    }
    .divider span { padding: 0 10px; }

    .pwd-form { display: flex; flex-direction: column; gap: 12px; }
    .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-dim); margin-bottom: 4px; }
    .input {
      width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-3); color: var(--text); font-size: 13px; box-sizing: border-box;
    }
    .btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: var(--accent); color: #fff; align-self: flex-start; }
    .btn-secondary { background: var(--bg-3); color: var(--text); border: 1px solid var(--border); }
  `]
})
export class SettingsComponent {
  readonly settingsService = inject(SettingsService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  currentPassword = '';
  newPassword = '';

  sendResetEmail(): void {
    const userEmail = this.authService.currentUser()?.email;
    if (!userEmail) return;

    this.authService.sendPasswordResetEmail(userEmail).subscribe({
      next: () => this.toast.show('Password reset email sent! Please check your inbox.'),
      error: (err) => this.toast.show(err.message || 'Failed to send reset email', 'error')
    });
  }

  changePassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.toast.show('New password must be at least 6 characters', 'error');
      return;
    }

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.toast.show('Password updated successfully!');
        this.currentPassword = '';
        this.newPassword = '';
      },
      error: (err) => this.toast.show(err.message || 'Failed to update password', 'error')
    });
  }
}
