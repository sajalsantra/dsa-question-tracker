import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile top bar -->
    <div class="mobile-topbar">
      <div class="mobile-brand">
        <div class="brand-icon">&lt;/&gt;</div>
        <span class="mobile-brand-text">DSA Tracker</span>
      </div>
      <div class="mobile-actions">
        <button class="theme-btn" (click)="settingsService.toggleTheme()">
          {{ settingsService.settings().theme === 'dark' ? '🌙' : '☀️' }}
        </button>
        @if (authService.isAuthenticated()) {
          <button class="auth-btn" (click)="authService.logout()">Logout</button>
        } @else {
          <button type="button" class="auth-btn" (click)="authModalService.open('signin')">🔑 Login</button>
        }
      </div>
    </div>

    <!-- Mobile bottom navigation -->
    <nav class="bottom-nav">
      <a routerLink="/dashboard" routerLinkActive="active" class="bottom-nav-item">
        <div class="icon-wrap"><div class="icon">📊</div></div>
        <span>Dashboard</span>
      </a>
      <a routerLink="/questions" routerLinkActive="active" class="bottom-nav-item">
        <div class="icon-wrap"><div class="icon">📚</div></div>
        <span>Questions</span>
      </a>
      <a routerLink="/revision" routerLinkActive="active" class="bottom-nav-item">
        <div class="icon-wrap"><div class="icon">🔁</div></div>
        <span>Revision</span>
      </a>
      <a routerLink="/analytics" routerLinkActive="active" class="bottom-nav-item">
        <div class="icon-wrap"><div class="icon">📈</div></div>
        <span>Analytics</span>
      </a>
      <a routerLink="/settings" routerLinkActive="active" class="bottom-nav-item">
        <div class="icon-wrap"><div class="icon">⚙️</div></div>
        <span>Settings</span>
      </a>
    </nav>
  `,
  styles: [`
    .mobile-topbar {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--header-h);
      background: var(--bg-2);
      border-bottom: 1px solid var(--border);
      z-index: 150;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
    }
    .mobile-brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon {
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--accent); display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 700; color: #fff;
    }
    .mobile-brand-text { font-size: 14px; font-weight: 700; color: var(--text); }
    .mobile-actions { display: flex; gap: 8px; align-items: center; }
    .theme-btn {
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--bg-3); border: 1px solid var(--border);
      font-size: 14px; display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .auth-btn {
      padding: 6px 12px; font-size: 12px; border-radius: 8px;
      background: var(--accent-soft); color: var(--accent);
      text-decoration: none; font-weight: 600; border: none;
      cursor: pointer;
    }

    .bottom-nav {
      display: none;
      position: fixed; bottom: 0; left: 0; right: 0;
      height: var(--bottom-nav-h);
      background: var(--bg-2);
      border-top: 1px solid var(--border);
      z-index: 200;
      align-items: center;
      justify-content: space-around;
      padding: 0 8px;
    }
    .bottom-nav-item {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      padding: 6px 10px; border-radius: 10px;
      font-size: 10px; font-weight: 500; color: var(--text-dim);
      text-decoration: none; min-width: 60px;
      transition: color var(--transition);
    }
    .bottom-nav-item .icon { font-size: 20px; }
    .bottom-nav-item.active { color: var(--accent); }
    .bottom-nav-item.active .icon-wrap {
      background: var(--accent-soft); border-radius: 10px;
      padding: 4px 12px;
    }

    @media (max-width: 768px) {
      .mobile-topbar { display: flex; }
      .bottom-nav { display: flex; }
    }
  `]
})
export class BottomNavComponent {
  readonly settingsService = inject(SettingsService);
  readonly authService = inject(AuthService);
  readonly authModalService = inject(AuthModalService);
}

