import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrichedQuestion, QuestionStatus } from '../../../core/models/progress.model';
import { ProgressService } from '../../../core/services/progress.service';
import { NotesService } from '../../../core/services/notes.service';
import { ActivityService } from '../../../core/services/activity.service';
import { ToastService } from '../../../core/services/toast.service';
import { calculateConfidence, getConfidenceDescriptor } from '../../../core/utils/confidence.utils';

@Component({
  selector: 'app-question-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen && question) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-card detail-modal" (click)="$event.stopPropagation()">

          <!-- Modal Header -->
          <div class="modal-header">
            <div>
              <div class="title-row">
                <h2 class="q-title">{{ question.title }}</h2>
                @if (question.problemUrl) {
                  <a [href]="question.problemUrl" target="_blank" rel="noopener" class="link-btn" title="Open problem link">
                    🔗 {{ question.platform }} ↗
                  </a>
                }
              </div>
              <div class="meta-row">
                <span class="badge badge-blue">{{ question.topic }}</span>
                <span class="badge badge-gray">{{ question.pattern }}</span>
                <span class="stars">{{ starStr(question.stars) }}</span>
              </div>
            </div>
            <button class="close-btn" (click)="close.emit()">✕</button>
          </div>

          <!-- Form Body -->
          <div class="modal-body">

            <!-- Status selector -->
            <div class="form-group">
              <label>Status</label>
              <div class="status-grid">
                @for (st of statusOptions; track st) {
                  <button
                    class="status-btn"
                    [class.active]="selectedStatus === st"
                    (click)="onStatusSelect(st)"
                  >
                    {{ statusIcon(st) }} {{ st }}
                  </button>
                }
              </div>
            </div>

            <!-- Metrics Row (Confidence, Attempts, Time) -->
            <div class="metrics-grid">
              <div class="form-group">
                <label>Confidence ({{ confidence }}% · {{ confidenceDescriptor }})</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  [(ngModel)]="confidence"
                  class="slider"
                />
              </div>

              <div class="form-group">
                <label>Attempts</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  [(ngModel)]="attempts"
                  (ngModelChange)="onMetricsChange()"
                  class="input-num"
                />
              </div>

              <div class="form-group">
                <label>Time Taken (mins)</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  [(ngModel)]="timeTaken"
                  (ngModelChange)="onMetricsChange()"
                  class="input-num"
                />
              </div>
            </div>

            <!-- Notes Editor -->
            <div class="form-group">
              <label>Notes & Code Snippets</label>
              <textarea
                [(ngModel)]="notesText"
                rows="6"
                placeholder="Write your approach, key intuition, complexity analysis, or code snippets here..."
                class="textarea-notes"
              ></textarea>
            </div>

            <!-- Toggles (Revision, Favorite) -->
            <div class="toggles-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="needsRevision" />
                <span>Flag for Revision Queue</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="isFavorite" />
                <span>Mark as Favorite ⭐</span>
              </label>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="close.emit()">Cancel</button>
            <button class="btn btn-primary" (click)="save()">Save Progress</button>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .detail-modal { max-width: 620px; }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .q-title { font-size: 18px; font-weight: 700; color: var(--text); }
    .link-btn {
      font-size: 11px; color: var(--accent); text-decoration: none;
      background: var(--accent-soft, rgba(91, 127, 255, 0.12)); padding: 4px 8px; border-radius: 6px; font-weight: 600;
    }
    .meta-row { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
    .badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    .badge-blue { background: rgba(91, 127, 255, 0.12); color: var(--accent, #5B7FFF); }
    .badge-gray { background: var(--bg-3, #232D45); color: var(--text-dim, #9AA5BE); }
    .stars { color: var(--orange, #F5A524); font-size: 12px; }
    .close-btn {
      background: none; border: none; font-size: 18px; color: var(--text-dim); cursor: pointer;
    }
    .close-btn:hover { color: var(--text); }

    .modal-body { padding: 16px 0; display: flex; flex-direction: column; gap: 16px; }

    .form-group label {
      display: block; font-size: 12px; font-weight: 600; color: var(--text-dim); margin-bottom: 6px;
    }

    .status-grid { display: flex; gap: 6px; flex-wrap: wrap; }
    .status-btn {
      flex: 1; min-width: 95px; padding: 8px 10px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--bg-3); color: var(--text-dim);
      font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .status-btn.active {
      border-color: var(--accent); background: var(--accent-soft, rgba(91, 127, 255, 0.12)); color: var(--accent);
    }

    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

    .slider { width: 100%; accent-color: var(--accent); cursor: pointer; }
    .input-num {
      width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-3); color: var(--text); font-size: 13px; box-sizing: border-box;
    }

    .textarea-notes {
      width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-3); color: var(--text); font-size: 12px; font-family: var(--mono, monospace);
      resize: vertical; box-sizing: border-box;
    }

    .toggles-row { display: flex; gap: 20px; font-size: 12px; color: var(--text); }
    .checkbox-label { display: flex; align-items: center; gap: 6px; cursor: pointer; }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px; padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    .btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
    .btn-secondary { background: var(--bg-3); color: var(--text); }
    .btn-primary { background: var(--accent); color: #fff; }
  `]
})
export class QuestionDetailModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() question: EnrichedQuestion | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private readonly progressService = inject(ProgressService);
  private readonly notesService = inject(NotesService);
  private readonly activityService = inject(ActivityService);
  private readonly toast = inject(ToastService);

  readonly statusOptions: QuestionStatus[] = [
    'Not Started', 'In Progress', 'Solved', 'Needs Revision', 'Mastered'
  ];

  selectedStatus: QuestionStatus = 'Not Started';
  confidence = 0;
  attempts = 0;
  timeTaken = 0;
  notesText = '';
  needsRevision = false;
  isFavorite = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['question'] && this.question) {
      this.selectedStatus = this.question.status;
      this.attempts = this.question.attempts;
      this.timeTaken = this.question.timeTaken;
      this.needsRevision = this.question.revision;
      this.isFavorite = this.question.favorite;
      this.notesText = this.notesService.getNote(this.question.id);

      // Auto-compute or load confidence
      if (this.question.confidence > 0) {
        this.confidence = this.question.confidence;
      } else if (this.attempts > 0 || this.timeTaken > 0) {
        this.confidence = calculateConfidence(this.attempts, this.timeTaken, this.question.stars);
      } else {
        this.confidence = 0;
      }
    }
  }

  get confidenceDescriptor(): string {
    return getConfidenceDescriptor(this.confidence);
  }

  starStr(stars: number): string {
    const s = Math.max(1, Math.min(5, Number(stars) || 3));
    return '★'.repeat(s) + '☆'.repeat(5 - s);
  }

  statusIcon(status: string): string {
    switch (status) {
      case 'Solved': return '✅';
      case 'Mastered': return '🏆';
      case 'Needs Revision': return '🔁';
      case 'In Progress': return '⏳';
      default: return '⚪';
    }
  }

  onStatusSelect(st: QuestionStatus): void {
    this.selectedStatus = st;
    if (st === 'Needs Revision') {
      this.needsRevision = true;
    }
    if ((st === 'Solved' || st === 'Mastered') && this.question) {
      if (this.attempts === 0) {
        this.attempts = 1;
      }
      this.confidence = calculateConfidence(this.attempts, this.timeTaken, this.question.stars);
    }
  }

  onMetricsChange(): void {
    if (this.question) {
      this.confidence = calculateConfidence(this.attempts, this.timeTaken, this.question.stars);
    }
  }

  save(): void {
    if (!this.question) return;

    const wasSolvedBefore = this.question.status === 'Solved' || this.question.status === 'Mastered';
    const isNowSolved = this.selectedStatus === 'Solved' || this.selectedStatus === 'Mastered';

    this.progressService.updateProgress(this.question.id, {
      status: this.selectedStatus,
      confidence: this.confidence,
      attempts: this.attempts,
      timeTaken: this.timeTaken,
      revision: this.needsRevision,
      favorite: this.isFavorite,
      ...(isNowSolved && !wasSolvedBefore ? { lastSolved: new Date().toISOString().slice(0, 10) } : {})
    });

    this.notesService.saveNote(this.question.id, this.notesText);

    if (isNowSolved && !wasSolvedBefore) {
      this.activityService.recordActivity();
    }

    this.toast.show('Question progress saved!');
    this.saved.emit();
    this.close.emit();
  }
}
