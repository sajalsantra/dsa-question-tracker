import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnrichedQuestion } from '../../../core/models/progress.model';

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="q-card" (click)="openDetail.emit(question)">
      <!-- Card Top: Title, Platform, Fav Button -->
      <div class="q-card-top">
        <div class="title-wrap">
          <div class="q-title" [title]="question.title">{{ question.title }}</div>
          <div class="q-platform">{{ question.platform }}</div>
        </div>
        <button
          class="fav-btn"
          [class.active]="question.favorite"
          (click)="$event.stopPropagation(); toggleFav.emit(question.id)"
          aria-label="Toggle favorite"
        >
          {{ question.favorite ? '★' : '☆' }}
        </button>
      </div>

      <!-- Tags: Topic, Pattern, Difficulty Badge -->
      <div class="q-tags">
        <span class="tag">{{ question.topic }}</span>
        <span class="tag">{{ question.pattern }}</span>
        <span class="diff-badge" [ngClass]="'diff-' + question.stars">
          {{ starStr(question.stars) }}
        </span>
      </div>

      <!-- Status Row & Badges -->
      <div class="q-status-row-counts">
        <div class="status-badge" [ngClass]="'status-' + slug(question.status)">
          {{ statusEmoji(question.status) }} {{ question.status }}
        </div>
        @if (question.status === 'Solved' || question.status === 'Mastered') {
          <span class="status-count-tag solved">
            ✓ {{ question.lastSolved ? 'Solved: ' + question.lastSolved : 'Solved' }}
          </span>
        }
        @if (question.revision || question.status === 'Needs Revision') {
          <span class="status-count-tag revision">🔄 Revision</span>
        }
      </div>

      <!-- Stats & Confidence Bar -->
      <div class="q-stats-block">
        <div class="q-stats-row">
          <span>Confidence: {{ question.confidence }}%</span>
          <span>Attempts: {{ question.attempts }}</span>
        </div>
        <div class="q-conf-bar">
          <div class="q-conf-fill" [style.width.%]="question.confidence"></div>
        </div>
      </div>

      <!-- Actions Row -->
      <div class="q-card-actions">
        @if (question.problemUrl) {
          <a
            class="btn small"
            [href]="question.problemUrl"
            target="_blank"
            rel="noopener"
            (click)="$event.stopPropagation()"
          >
            Open ↗
          </a>
        } @else {
          <span class="btn small" disabled>No Link</span>
        }
        <button
          class="btn small"
          (click)="$event.stopPropagation(); markRevise.emit(question.id)"
        >
          🔄 Revise
        </button>
        <button
          class="btn small"
          (click)="$event.stopPropagation(); toggleFav.emit(question.id)"
        >
          {{ question.favorite ? '★' : '☆' }} Fav
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .q-card {
      background: var(--bg-2, #131A2B);
      border: 1px solid var(--border, #26314A);
      border-radius: 14px;
      padding: 16px;
      height: 100%;
      box-sizing: border-box;
      transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
    }

    .q-card:hover {
      border-color: var(--accent, #5B7FFF);
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

    .q-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .title-wrap {
      flex: 1;
      min-width: 0;
    }

    .q-title {
      font-size: 14.5px;
      font-weight: 700;
      line-height: 1.35;
      color: var(--text, #E9EDF6);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.7em;
    }

    .q-platform {
      font-size: 11px;
      color: var(--text-faint, #5D6785);
      font-family: var(--mono, 'JetBrains Mono', monospace);
      margin-top: 3px;
    }

    .fav-btn {
      background: none;
      border: none;
      font-size: 17px;
      color: var(--text-faint, #5D6785);
      flex-shrink: 0;
      line-height: 1;
      cursor: pointer;
      transition: color 0.15s;
    }

    .fav-btn.active {
      color: var(--orange, #F5A524);
    }

    .q-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
      min-height: 28px;
    }

    .tag {
      font-size: 10.5px;
      font-family: var(--mono, 'JetBrains Mono', monospace);
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--bg-3, #232D45);
      color: var(--text-dim, #9AA5BE);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }

    .diff-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 6px;
      font-family: var(--mono, 'JetBrains Mono', monospace);
      letter-spacing: 0.03em;
    }

    .diff-1 { color: #2FD180; background: rgba(47,209,128,0.12); }
    .diff-2 { color: #8BC34A; background: rgba(139,195,74,0.12); }
    .diff-3 { color: #F5A524; background: rgba(245,165,36,0.12); }
    .diff-4 { color: #F2790C; background: rgba(242,121,12,0.12); }
    .diff-5 { color: #F0546B; background: rgba(240,84,107,0.12); }

    .q-status-row-counts {
      display: flex;
      gap: 5px;
      align-items: center;
      flex-wrap: wrap;
      min-height: 26px;
    }

    .status-badge {
      font-size: 10.5px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      width: fit-content;
      white-space: nowrap;
    }

    .status-Unsolved, .status-Not-Started { background: rgba(148,163,184,0.12); color: var(--text-dim, #9AA5BE); }
    .status-In-Progress { background: rgba(245,165,36,0.12); color: #F5A524; }
    .status-Solved { background: rgba(47,209,128,0.12); color: #2FD180; }
    .status-Needs-Revision { background: rgba(56,189,248,0.12); color: #38BDF8; }
    .status-Mastered { background: rgba(155,107,255,0.14); color: #9B6BFF; }

    .status-count-tag {
      font-size: 10.5px;
      font-family: var(--mono, 'JetBrains Mono', monospace);
      font-weight: 600;
      padding: 2.5px 7px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
    }

    .status-count-tag.solved {
      background: rgba(47,209,128,0.12);
      color: #2FD180;
      border: 1px solid rgba(47,209,128,0.22);
    }

    .status-count-tag.revision {
      background: rgba(56,189,248,0.12);
      color: #38BDF8;
      border: 1px solid rgba(56,189,248,0.22);
    }

    .q-stats-block {
      margin-top: auto;
    }

    .q-stats-row {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      font-size: 11.5px;
      color: var(--text-dim, #9AA5BE);
      font-family: var(--mono, 'JetBrains Mono', monospace);
    }

    .q-conf-bar {
      height: 4px;
      background: var(--bg-3, #232D45);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 4px;
    }

    .q-conf-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(135deg, #5B7FFF 0%, #9B6BFF 100%);
    }

    .q-card-actions {
      display: flex;
      gap: 7px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .q-card-actions .btn {
      flex: 1;
      justify-content: center;
      padding: 7px 8px;
      font-size: 11.5px;
      border-radius: 8px;
      border: 1px solid var(--border, #26314A);
      background: var(--bg-3, #232D45);
      color: var(--text, #E9EDF6);
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .q-card-actions .btn:hover {
      border-color: var(--accent, #5B7FFF);
      background: var(--border, #26314A);
    }

    .q-card-actions .btn[disabled] {
      opacity: 0.4;
      pointer-events: none;
    }
  `]
})
export class QuestionCardComponent {
  @Input({ required: true }) question!: EnrichedQuestion;

  @Output() openDetail = new EventEmitter<EnrichedQuestion>();
  @Output() toggleFav = new EventEmitter<number>();
  @Output() markRevise = new EventEmitter<number>();

  slug(s: string): string {
    return (s || '').replace(/\s+/g, '-');
  }

  starStr(stars: number): string {
    const s = Math.max(1, Math.min(5, Number(stars) || 3));
    return '★'.repeat(s) + '☆'.repeat(5 - s);
  }

  statusEmoji(status: string): string {
    switch (status) {
      case 'Solved': return '✅';
      case 'Mastered': return '🏆';
      case 'Needs Revision': return '🔄';
      case 'In Progress': return '⏳';
      default: return '🔴';
    }
  }
}
