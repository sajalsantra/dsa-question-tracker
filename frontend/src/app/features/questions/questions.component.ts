import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterService } from '../../core/services/filter.service';
import { ProgressService } from '../../core/services/progress.service';
import { QuestionsFilterComponent } from './questions-filter/questions-filter.component';
import { QuestionCardComponent } from './question-card/question-card.component';
import { QuestionDetailModalComponent } from './question-detail-modal/question-detail-modal.component';
import { EnrichedQuestion } from '../../core/models/progress.model';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [
    CommonModule,
    QuestionsFilterComponent,
    QuestionCardComponent,
    QuestionDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">📚 Questions</h1>
        <p class="page-sub">499 curated DSA problems · Search, filter, and track progress</p>
      </div>

      <!-- Filter bar -->
      <app-questions-filter></app-questions-filter>

      <!-- Questions grid -->
      @if (filterService.paginatedQuestions().length > 0) {
        <div class="q-grid">
          @for (q of filterService.paginatedQuestions(); track q.id) {
            <app-question-card
              [question]="q"
              (openDetail)="selectedQuestion = $event; isModalOpen = true"
              (toggleFav)="progressService.toggleFavorite($event)"
              (markRevise)="progressService.updateProgress($event, { status: 'Needs Revision', revision: true })"
            ></app-question-card>
          }
        </div>

        <!-- Pagination Bar -->
        @if (filterService.totalPages() > 1) {
          <div class="pagination-bar">
            <button
              class="page-btn"
              [disabled]="filterService.currentPage() === 1"
              (click)="filterService.setPage(filterService.currentPage() - 1)"
            >
              ◀ Prev
            </button>
            <span class="page-info">
              Page {{ filterService.currentPage() }} of {{ filterService.totalPages() }}
            </span>
            <button
              class="page-btn"
              [disabled]="filterService.currentPage() === filterService.totalPages()"
              (click)="filterService.setPage(filterService.currentPage() + 1)"
            >
              Next ▶
            </button>
          </div>
        }
      } @else {
        <div class="empty-state card">
          <p>🔍 No questions found matching current filters.</p>
          <button class="btn-link" (click)="filterService.clearFilters()">Clear Filters</button>
        </div>
      }

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

    .q-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 14px;
      align-items: stretch;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 24px;
    }
    .page-btn {
      padding: 8px 14px;
      border-radius: 8px;
      background: var(--bg-2);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 12px;
      font-weight: 600;
    }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 12px; color: var(--text-dim); }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-dim);
      font-size: 14px;
    }
    .btn-link {
      background: none; border: none; color: var(--accent);
      text-decoration: underline; margin-top: 8px; cursor: pointer;
    }
  `]
})
export class QuestionsComponent {
  readonly filterService = inject(FilterService);
  readonly progressService = inject(ProgressService);

  isModalOpen = false;
  selectedQuestion: EnrichedQuestion | null = null;
}
