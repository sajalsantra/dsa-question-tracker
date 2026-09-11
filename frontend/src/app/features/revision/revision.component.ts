import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevisionService } from '../../core/services/revision.service';
import { ProgressService } from '../../core/services/progress.service';
import { QuestionCardComponent } from '../questions/question-card/question-card.component';
import { QuestionDetailModalComponent } from '../questions/question-detail-modal/question-detail-modal.component';
import { EnrichedQuestion } from '../../core/models/progress.model';

@Component({
  selector: 'app-revision',
  standalone: true,
  imports: [
    CommonModule,
    QuestionCardComponent,
    QuestionDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">🔁 Revision Queue</h1>
        <p class="page-sub">
          {{ revisionService.revisionQueue().length }} questions auto-flagged based on confidence, time taken, attempts, or recency.
        </p>
      </div>

      @if (revisionService.revisionQueue().length > 0) {
        <div class="revision-grid">
          @for (entry of revisionService.revisionQueue(); track entry.question.id) {
            <div class="rev-card-wrap">
              <div class="reason-badge">⚠️ {{ entry.reason }}</div>
              <app-question-card
                [question]="entry.question"
                (openDetail)="selectedQuestion = $event; isModalOpen = true"
                (toggleFav)="progressService.toggleFavorite($event)"
              ></app-question-card>
            </div>
          }
        </div>
      } @else {
        <div class="card empty-card">
          <div class="empty-icon">🎉</div>
          <h2>Revision Queue is Clean!</h2>
          <p>You have no pending questions flagged for revision right now. Keep solving new problems!</p>
        </div>
      }

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

    .revision-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .rev-card-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .reason-badge {
      font-size: 11px;
      font-weight: 600;
      color: var(--orange);
      background: rgba(245, 165, 36, 0.12);
      padding: 4px 10px;
      border-radius: 6px;
      align-self: flex-start;
    }

    .empty-card {
      text-align: center;
      padding: 60px 20px;
      color: var(--text);
    }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-card h2 { font-size: 18px; margin-bottom: 8px; }
    .empty-card p { font-size: 13px; color: var(--text-dim); }
  `]
})
export class RevisionComponent {
  readonly revisionService = inject(RevisionService);
  readonly progressService = inject(ProgressService);

  isModalOpen = false;
  selectedQuestion: EnrichedQuestion | null = null;
}
