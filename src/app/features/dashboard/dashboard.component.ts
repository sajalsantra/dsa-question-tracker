import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QuestionService } from '../../core/services/question.service';
import { ProgressService } from '../../core/services/progress.service';
import { StreakService } from '../../core/services/streak.service';
import { ReadinessService } from '../../core/services/readiness.service';
import { RevisionService } from '../../core/services/revision.service';
import { FilterService } from '../../core/services/filter.service';
import { QuestionCardComponent } from '../questions/question-card/question-card.component';
import { QuestionDetailModalComponent } from '../questions/question-detail-modal/question-detail-modal.component';
import { EnrichedQuestion } from '../../core/models/progress.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    QuestionCardComponent,
    QuestionDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">📊 Dashboard</h1>
        <p class="page-sub">Your DSA progress at a glance · Master questions systematically</p>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Questions</div>
          <div class="kpi-value">{{ questionService.questions().length }}</div>
          <div class="kpi-sub">Full curated dataset</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Solved</div>
          <div class="kpi-value green">{{ progressService.solvedCount() }}</div>
          <div class="kpi-sub">✅ {{ progressPct() }}% complete</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Pending</div>
          <div class="kpi-value">{{ pendingCount() }}</div>
          <div class="kpi-sub">Not started / In progress</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Revision Queue</div>
          <div class="kpi-value orange">{{ revisionService.revisionQueue().length }}</div>
          <div class="kpi-sub">Auto-flagged for review</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Streak</div>
          <div class="kpi-value orange">{{ streakService.streak().current }} 🔥</div>
          <div class="kpi-sub">Longest: {{ streakService.streak().longest }} days</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Readiness</div>
          <div class="kpi-value accent">{{ readinessService.readiness().score }}%</div>
          <div class="kpi-sub">{{ readinessService.readiness().tag }} level</div>
        </div>
      </div>

      <!-- Readiness & Recommendations Section -->
      <div class="content-grid">

        <!-- Readiness gauge -->
        <div class="card">
          <div class="card-title">🎯 Interview Readiness</div>
          <div class="readiness-wrap">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-3)" stroke-width="8"/>
              <circle
                cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" stroke-width="8"
                [attr.stroke-dasharray]="251"
                [attr.stroke-dashoffset]="251 - (251 * readinessService.readiness().score / 100)"
                stroke-linecap="round"
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="55" text-anchor="middle" fill="var(--text)" font-size="18" font-weight="700">
                {{ readinessService.readiness().score }}%
              </text>
            </svg>

            <div>
              <div class="readiness-tag">{{ readinessService.readiness().tag }} Level</div>
              @if (readinessService.readiness().weakTopics.length > 0) {
                <div class="weak-topics">
                  ⚠️ Focus topics: {{ readinessService.readiness().weakTopics.join(', ') }}
                </div>
              } @else {
                <div class="strong-msg">🌟 Great balanced topic coverage!</div>
              }
            </div>
          </div>
        </div>

        <!-- Topic breakdown summary -->
        <div class="card">
          <div class="card-title">📚 Topic Progress Overview</div>
          <div class="topic-list">
            @for (t of filterService.topicStats().slice(0, 5); track t.topic) {
              <div class="topic-row">
                <span class="topic-name">{{ t.topic }}</span>
                <div class="bar-wrap">
                  <div class="bar-fill" [style.width.%]="t.completion"></div>
                </div>
                <span class="topic-pct">{{ t.solved }}/{{ t.total }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Recent / Recommended Questions -->
        <div class="card wide">
          <div class="card-header">
            <div class="card-title">🔥 Recommended Next Problems</div>
            <a routerLink="/questions" class="view-all-link">View All 499 →</a>
          </div>

          <div class="q-grid">
            @for (q of recommendedQuestions(); track q.id) {
              <app-question-card
                [question]="q"
                (openDetail)="selectedQuestion = $event; isModalOpen = true"
                (toggleFav)="progressService.toggleFavorite($event)"
              ></app-question-card>
            }
          </div>
        </div>

      </div>

      <!-- Question Detail Modal -->
      <app-question-detail-modal
        [isOpen]="isModalOpen"
        [question]="selectedQuestion"
        (close)="isModalOpen = false"
      ></app-question-detail-modal>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text); }
    .page-sub { font-size: 13px; color: var(--text-dim); margin-top: 4px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      transition: border-color 0.15s;
    }
    .kpi-card:hover { border-color: var(--accent); }
    .kpi-label { font-size: 11px; color: var(--text-dim); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 28px; font-weight: 700; color: var(--text); margin: 4px 0; }
    .kpi-value.accent { color: var(--accent); }
    .kpi-value.green { color: var(--green); }
    .kpi-value.orange { color: var(--orange); }
    .kpi-sub { font-size: 11px; color: var(--text-dim); }

    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card {
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
    }
    .card.wide { grid-column: span 2; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .card-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
    .view-all-link { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }

    .readiness-wrap { display: flex; align-items: center; gap: 20px; }
    .readiness-tag { font-size: 15px; font-weight: 700; color: var(--text); }
    .weak-topics { font-size: 12px; color: var(--orange); margin-top: 4px; }
    .strong-msg { font-size: 12px; color: var(--green); margin-top: 4px; }

    .topic-list { display: flex; flex-direction: column; gap: 10px; }
    .topic-row { display: flex; align-items: center; gap: 12px; font-size: 12px; }
    .topic-name { width: 120px; color: var(--text); font-weight: 500; truncate: true; }
    .bar-wrap { flex: 1; height: 6px; background: var(--bg-3); border-radius: 99px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--accent); border-radius: 99px; }
    .topic-pct { font-size: 11px; color: var(--text-dim); min-width: 45px; text-align: right; }

    .q-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }

    @media (max-width: 768px) {
      .content-grid { grid-template-columns: 1fr; }
      .card.wide { grid-column: span 1; }
    }
  `]
})
export class DashboardComponent {
  readonly questionService = inject(QuestionService);
  readonly progressService = inject(ProgressService);
  readonly streakService = inject(StreakService);
  readonly readinessService = inject(ReadinessService);
  readonly revisionService = inject(RevisionService);
  readonly filterService = inject(FilterService);

  isModalOpen = false;
  selectedQuestion: EnrichedQuestion | null = null;

  progressPct(): number {
    const total = this.questionService.questions().length;
    if (!total) return 0;
    return Math.round((this.progressService.solvedCount() / total) * 100);
  }

  pendingCount(): number {
    return this.questionService.questions().length - this.progressService.solvedCount();
  }

  recommendedQuestions(): EnrichedQuestion[] {
    const recs = this.readinessService.readiness().recommendedNext;
    if (recs.length >= 8) return recs;
    // Fallback: unsolved easy questions
    const fallback = this.filterService.enrichedQuestions()
      .filter(q => q.status === 'Not Started' && !recs.some(r => r.id === q.id));
    return [...recs, ...fallback].slice(0, 8);
  }
}
