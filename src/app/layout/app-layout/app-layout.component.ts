import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { QuestionService } from '../../core/services/question.service';
import { ProgressService } from '../../core/services/progress.service';
import { NotesService } from '../../core/services/notes.service';
import { ActivityService } from '../../core/services/activity.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';

import { AuthModalComponent } from '../../features/auth/auth-modal.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, BottomNavComponent, ToastComponent, AuthModalComponent],
  template: `
    <app-sidebar></app-sidebar>
    <app-bottom-nav></app-bottom-nav>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <app-toast></app-toast>
    <app-auth-modal></app-auth-modal>
  `,
  styles: [`
    .main-content {
      margin-left: var(--sidebar-w);
      min-height: 100vh;
      padding: 24px;
      transition: margin var(--transition);
    }
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
        padding: 16px;
        padding-top: calc(var(--header-h) + 16px);
        padding-bottom: calc(var(--bottom-nav-h) + 16px);
      }
    }
  `]
})
export class AppLayoutComponent implements OnInit {
  private readonly questionService = inject(QuestionService);
  private readonly progressService = inject(ProgressService);
  private readonly notesService = inject(NotesService);
  private readonly activityService = inject(ActivityService);
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    // Initial data loading from local repositories / JSON asset
    this.questionService.loadQuestions().subscribe();
    this.progressService.load();
    this.notesService.load();
    this.activityService.load();
    this.settingsService.load();
    this.authService.load();
  }
}
