import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QuestionService } from '../../core/services/question.service';
import { ProgressService } from '../../core/services/progress.service';
import { StreakService } from '../../core/services/streak.service';
import { RevisionService } from '../../core/services/revision.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">&lt;/&gt;</div>
        <div>
          <div class="brand-text">DSA Tracker</div>
          <div class="brand-sub">Master DSA systematically</div>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="sidebar-stats">
        <div class="sstat">
          <div class="sstat-val green">{{ progressService.solvedCount() }}</div>
          <div class="sstat-lbl">Solved</div>
        </div>
        <div class="sstat">
          <div class="sstat-val accent">{{ progressPct() }}%</div>
          <div class="sstat-lbl">Progress</div>
        </div>
        <div class="sstat">
          <div class="sstat-val orange">{{ streakService.streak().current }} 🔥</div>
          <div class="sstat-lbl">Streak</div>
        </div>
        <div class="sstat">
          <div class="sstat-val">{{ questionService.questions().length }}</div>
          <div class="sstat-lbl">Total</div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="sidebar-progress">
        <div class="progress-row">
          <span>Overall Progress</span>
          <span style="color:var(--accent)">{{ progressPct() }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPct()"></div>
        </div>
      </div>

      <!-- Navigation links -->
      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
          <span class="icon">📊</span> Dashboard
        </a>
        <a routerLink="/questions" routerLinkActive="active" class="nav-link">
          <span class="icon">📚</span> Questions
          <span class="nav-badge">{{ questionService.questions().length }}</span>
        </a>
        <a routerLink="/revision" routerLinkActive="active" class="nav-link">
          <span class="icon">🔁</span> Revision Queue
          <span class="nav-badge orange">{{ revisionService.revisionQueue().length }}</span>
        </a>
        <a routerLink="/analytics" routerLinkActive="active" class="nav-link">
          <span class="icon">📈</span> Analytics
        </a>
        <a routerLink="/streak-goals" routerLinkActive="active" class="nav-link">
          <span class="icon">🔥</span> Streak & Goals
        </a>

        <div class="sidebar-divider"></div>

        <a routerLink="/settings" routerLinkActive="active" class="nav-link">
          <span class="icon">⚙️</span> Settings
        </a>
        <a routerLink="/data-management" routerLinkActive="active" class="nav-link">
          <span class="icon">💾</span> Data Management
        </a>
      </nav>

      <!-- Sidebar footer -->
      <div class="sidebar-footer">
        @if (authService.isAuthenticated()) {
          <div class="user-chip">
            <span class="user-name">👤 {{ authService.currentUser()?.name }}</span>
            <button class="logout-btn" (click)="authService.logout()">Logout</button>
          </div>
        } @else {
          <button type="button" class="auth-btn" (click)="authModalService.open('signin')">🔑 Sign In / Sign Up</button>
        }

        <div class="footer-row">
          <span class="save-indicator">🟢 Saved locally</span>
          <button class="theme-btn" (click)="settingsService.toggleTheme()" title="Toggle theme">
            {{ settingsService.settings().theme === 'dark' ? '🌙' : '☀️' }}
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--sidebar-w);
      background: var(--bg-2);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      z-index: 100;
      transition: transform 0.3s ease, background var(--transition);
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 20px 16px;
      border-bottom: 1px solid var(--border);
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .brand-text { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.2; }
    .brand-sub { font-size: 10px; color: var(--text-dim); margin-top: 2px; }

    .sidebar-stats {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .sstat { background: var(--bg-3); border-radius: 8px; padding: 8px 10px; }
    .sstat-val { font-size: 16px; font-weight: 700; color: var(--text); }
    .sstat-val.accent { color: var(--accent); }
    .sstat-val.green { color: var(--green); }
    .sstat-val.orange { color: var(--orange); }
    .sstat-lbl { font-size: 10px; color: var(--text-dim); margin-top: 2px; }

    .sidebar-progress {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
    }
    .progress-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-dim); margin-bottom: 6px; }
    .progress-bar { height: 6px; background: var(--bg-3); border-radius: 99px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #A78BFA); border-radius: 99px; transition: width 0.6s ease; }

    .sidebar-nav {
      flex: 1;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-dim);
      text-decoration: none;
      transition: background var(--transition), color var(--transition);
    }
    .nav-link:hover { background: var(--bg-3); color: var(--text); }
    .nav-link.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
    .nav-link .icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
    .nav-badge {
      margin-left: auto;
      background: var(--accent);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 99px;
    }
    .nav-badge.orange { background: var(--orange); }

    .sidebar-divider { height: 1px; background: var(--border); margin: 8px 10px; }

    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .auth-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 9px 12px;
      border-radius: 10px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: background var(--transition);
    }
    .auth-btn:hover { background: rgba(91, 127, 255, 0.2); }
    .user-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: var(--bg-3);
      border-radius: 8px;
      font-size: 12px;
    }
    .user-name { color: var(--text); font-weight: 600; }
    .logout-btn {
      background: none;
      border: none;
      color: var(--red);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }

    .footer-row { display: flex; align-items: center; justify-content: space-between; }
    .save-indicator { font-size: 11px; color: var(--green); }
    .theme-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--bg-3);
      border: 1px solid var(--border);
      cursor: pointer;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition);
    }
    .theme-btn:hover { background: var(--border); }

    @media (max-width: 768px) {
      .sidebar { display: none; }
    }
  `]
})
export class SidebarComponent {
  readonly questionService = inject(QuestionService);
  readonly progressService = inject(ProgressService);
  readonly streakService = inject(StreakService);
  readonly revisionService = inject(RevisionService);
  readonly settingsService = inject(SettingsService);
  readonly authService = inject(AuthService);
  readonly authModalService = inject(AuthModalService);

  progressPct(): number {
    const total = this.questionService.questions().length;
    if (!total) return 0;
    return Math.round((this.progressService.solvedCount() / total) * 100);
  }
}

