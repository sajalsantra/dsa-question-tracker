import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService } from '../../../core/services/filter.service';
import { QuestionService } from '../../../core/services/question.service';
import { SortOption } from '../../../core/models/filter.model';

@Component({
  selector: 'app-questions-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-panel card">
      <!-- Search row -->
      <div class="search-row">
        <div class="input-wrap">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title, topic, pattern..."
            [ngModel]="filterService.filters().search"
            (ngModelChange)="filterService.updateFilter('search', $event)"
            class="search-input"
          />
        </div>
        <select
          [ngModel]="filterService.filters().topic"
          (ngModelChange)="filterService.updateFilter('topic', $event)"
          class="select-control"
        >
          <option value="All">All Topics</option>
          @for (top of questionService.topics; track top) {
            <option [value]="top">{{ top }}</option>
          }
        </select>
      </div>

      <!-- Filters row -->
      <div class="controls-row">
        <select
          [ngModel]="filterService.filters().status"
          (ngModelChange)="filterService.updateFilter('status', $event)"
          class="select-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Solved">Solved</option>
          <option value="Needs Revision">Needs Revision</option>
          <option value="Mastered">Mastered</option>
        </select>

        <select
          [ngModel]="filterService.filters().difficulty"
          (ngModelChange)="filterService.updateFilter('difficulty', $event)"
          class="select-sm"
        >
          <option value="All">All Difficulties</option>
          <option value="1">★☆☆☆☆ (Easy)</option>
          <option value="2">★★☆☆☆</option>
          <option value="3">★★★☆☆ (Medium)</option>
          <option value="4">★★★★☆</option>
          <option value="5">★★★★★ (Hard)</option>
        </select>

        <select
          [ngModel]="filterService.filters().confidence"
          (ngModelChange)="filterService.updateFilter('confidence', $event)"
          class="select-sm"
        >
          <option value="All">All Confidence</option>
          <option value="0-30">0% - 30%</option>
          <option value="31-60">31% - 60%</option>
          <option value="61-80">61% - 80%</option>
          <option value="81-100">81% - 100%</option>
        </select>

        <select
          [ngModel]="filterService.filters().favorite"
          (ngModelChange)="filterService.updateFilter('favorite', $event)"
          class="select-sm"
        >
          <option value="All">All Questions</option>
          <option value="Favorites">Favorites Only ⭐</option>
        </select>

        <select
          [ngModel]="filterService.filters().sort"
          (ngModelChange)="onSortChange($event)"
          class="select-sm sort-select"
        >
          <option value="difficulty">Sort: Difficulty</option>
          <option value="recent">Sort: Recently Solved</option>
          <option value="confidence">Sort: Confidence</option>
          <option value="attempts">Sort: Attempts</option>
          <option value="topic">Sort: Topic</option>
          <option value="alpha">Sort: Alphabetical</option>
        </select>

        <button class="clear-btn" (click)="filterService.clearFilters()">Clear Filters</button>
      </div>

      <!-- Active Filter Chips Bar -->
      <div class="info-bar">
        <span>Showing <strong>{{ filterService.totalFiltered() }}</strong> of {{ filterService.enrichedQuestions().length }} questions</span>
      </div>
    </div>
  `,
  styles: [`
    .filter-panel {
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .search-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
    }
    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      font-size: 13px;
      color: var(--text-dim);
    }
    .search-input {
      width: 100%;
      padding: 9px 12px 9px 34px;
      background: var(--bg-3);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 13px;
    }
    .select-control {
      background: var(--bg-3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 9px 12px;
      color: var(--text);
      font-size: 13px;
    }
    .controls-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .select-sm {
      background: var(--bg-3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 7px 10px;
      color: var(--text);
      font-size: 12px;
    }
    .sort-select { font-weight: 600; color: var(--accent); }
    .clear-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--text-dim);
      font-size: 12px;
      text-decoration: underline;
    }
    .clear-btn:hover { color: var(--red); }
    .info-bar {
      font-size: 12px;
      color: var(--text-dim);
      border-top: 1px solid var(--border);
      padding-top: 10px;
    }
    @media (max-width: 768px) {
      .search-row { grid-template-columns: 1fr; }
    }
  `]
})
export class QuestionsFilterComponent {
  readonly filterService = inject(FilterService);
  readonly questionService = inject(QuestionService);

  onSortChange(value: string): void {
    this.filterService.updateFilter('sort', value as SortOption);
  }
}
