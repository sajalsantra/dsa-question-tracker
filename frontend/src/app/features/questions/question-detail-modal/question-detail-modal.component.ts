import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EnrichedQuestion,
  QuestionStatus,
} from '../../../core/models/progress.model';
import { ProgressService } from '../../../core/services/progress.service';
import { NotesService } from '../../../core/services/notes.service';
import { ActivityService } from '../../../core/services/activity.service';
import { ToastService } from '../../../core/services/toast.service';
import { AiService, ChatMessage } from '../../../core/services/ai.service';
import {
  calculateConfidence,
  getConfidenceDescriptor,
} from '../../../core/utils/confidence.utils';

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
                  <a
                    [href]="question.problemUrl"
                    target="_blank"
                    rel="noopener"
                    class="link-btn"
                    title="Open problem link"
                  >
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

          <!-- Navigation Tabs -->
          <div class="modal-tabs">
            <button
              class="tab-btn"
              [class.active]="activeTab === 'notes'"
              (click)="selectTab('notes')"
            >
              📝 Progress & Notes
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab === 'ai'"
              (click)="selectTab('ai')"
            >
              🤖 Beru (AI Mentor)
            </button>
          </div>

          <!-- Form Body: Notes Tab -->
          @if (activeTab === 'notes') {
            <div class="modal-body">
              <!-- AI Quick Shortcut Banner -->
              <div class="ai-quick-banner" (click)="selectTab('ai')">
                <div class="banner-text">
                  🤖 <strong>Need Help?</strong> Ask <strong>Beru AI Mentor</strong> for hints, complexity analysis, or code review!
                </div>
                <button class="btn-ai-shortcut">Ask AI ➔</button>
              </div>

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
                  <label
                    >Confidence ({{ confidence }}% ·
                    {{ confidenceDescriptor }})</label
                  >
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
              <div class="form-group flex-notes">
                <label>Notes & Code Snippets</label>
                <textarea
                  [(ngModel)]="notesText"
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
          }

          <!-- Form Body: AI Mentor Tab -->
          @if (activeTab === 'ai') {
            <div class="modal-body ai-body">
              <!-- Quick Action Chips -->
              <div class="chips-row">
                <button
                  class="chip-btn"
                  [disabled]="isAiThinking"
                  (click)="triggerAiAction('HINT')"
                >
                  💡 Give Hint 1
                </button>
                <button
                  class="chip-btn"
                  [disabled]="isAiThinking"
                  (click)="triggerAiAction('APPROACH')"
                >
                  🧠 Optimal Approach
                </button>
                <button
                  class="chip-btn"
                  [disabled]="isAiThinking"
                  (click)="triggerAiAction('COMPLEXITY')"
                >
                  ⏱️ Target Complexity
                </button>
                <button
                  class="chip-btn"
                  [disabled]="isAiThinking"
                  (click)="triggerAiAction('CODE_REVIEW')"
                >
                  🐛 Review Code in Notes
                </button>
              </div>

              <!-- Chat Container -->
              <div class="chat-container" #chatContainer>
                <div class="chat-date-divider">
                  <span>{{ chatFormattedDate }}</span>
                </div>

                @for (msg of chatMessages; track $index) {
                  <div class="chat-bubble" [class.user]="msg.sender === 'user'" [class.ai]="msg.sender === 'ai'">
                    <div class="bubble-content" [innerHTML]="formatMarkdown(msg.text)"></div>
                  </div>
                }

                @if (isAiThinking) {
                  <div class="chat-bubble ai thinking">
                    <span class="spinner">⏳</span> 🤖 Beru is analyzing the problem...
                  </div>
                }

                <div #chatEnd></div>
              </div>

              <!-- Chat Input Bar -->
              <div class="chat-input-bar">
                <input
                  type="text"
                  [(ngModel)]="customPrompt"
                  (keyup.enter)="sendCustomPrompt()"
                  [disabled]="isAiThinking"
                  placeholder="Ask any question about this problem..."
                  class="chat-input"
                />
                <button
                  class="send-btn"
                  (click)="sendCustomPrompt()"
                  [disabled]="!customPrompt.trim() || isAiThinking"
                  title="Send message"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          }

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-danger"
              (click)="resetQuestion()"
              title="Reset all progress & notes for this question"
            >
              🔄 Reset Question
            </button>
            <div class="right-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="close.emit()"
              >
                Cancel
              </button>
              <button type="button" class="btn btn-primary" (click)="save()">
                Save Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .detail-modal {
        width: 90%;
        max-width: 660px;
        height: 630px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
        flex-shrink: 0;
      }
      .title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .q-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--text);
      }
      .link-btn {
        font-size: 11px;
        color: var(--accent);
        text-decoration: none;
        background: var(--accent-soft, rgba(91, 127, 255, 0.12));
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
      }
      .meta-row {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-top: 6px;
      }
      .badge {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 600;
      }
      .badge-blue {
        background: rgba(91, 127, 255, 0.12);
        color: var(--accent, #5b7fff);
      }
      .badge-gray {
        background: var(--bg-3, #232d45);
        color: var(--text-dim, #9aa5be);
      }
      .stars {
        color: var(--orange, #f5a524);
        font-size: 12px;
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 18px;
        color: var(--text-dim);
        cursor: pointer;
      }
      .close-btn:hover {
        color: var(--text);
      }

      /* Navigation Tabs - CLEAN PREVIOUS DESIGN */
      .modal-tabs {
        display: flex;
        gap: 16px;
        margin-top: 12px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 0;
        flex-shrink: 0;
      }
      .tab-btn {
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-dim, #94a3b8);
        font-size: 13px;
        font-weight: 600;
        padding: 8px 4px 10px 4px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .tab-btn:hover {
        color: var(--text, #f8fafc);
      }
      .tab-btn.active {
        color: var(--accent, #5b7fff);
        border-bottom-color: var(--accent, #5b7fff);
      }

      /* AI Quick Shortcut Banner */
      .ai-quick-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, rgba(91, 127, 255, 0.12), rgba(139, 92, 246, 0.12));
        border: 1px solid rgba(91, 127, 255, 0.25);
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 12px;
        color: var(--text);
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      .ai-quick-banner:hover {
        border-color: var(--accent);
        background: linear-gradient(135deg, rgba(91, 127, 255, 0.22), rgba(139, 92, 246, 0.22));
      }
      .btn-ai-shortcut {
        background: var(--accent);
        color: #fff;
        border: none;
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(91, 127, 255, 0.3);
      }

      .modal-body {
        flex: 1;
        overflow-y: hidden;
        padding: 16px 0 6px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 0;
      }

      .ai-body {
        gap: 12px;
        overflow: hidden;
      }

      /* Quick Chips Row */
      .chips-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .chip-btn {
        background: var(--bg-3);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }
      .chip-btn:hover:not(:disabled) {
        border-color: var(--accent);
        color: var(--accent);
      }

      /* Chat Container - EXPANDS TO FILL FIXED BODY HEIGHT */
      .chat-container {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 14px;
        background: var(--bg-3);
        border: 1px solid var(--border);
        border-radius: 10px;
      }
      .chat-container::-webkit-scrollbar {
        width: 6px;
      }
      .chat-container::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      .chat-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      .chat-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.35);
      }
      .chat-date-divider {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 4px 0 10px 0;
        text-align: center;
      }
      .chat-date-divider span {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.06);
        padding: 4px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        letter-spacing: 0.5px;
      }

      .chat-bubble {
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.6;
        max-width: 90%;
      }
      .chat-bubble.user {
        align-self: flex-end;
        background: var(--accent);
        color: #fff;
        border-bottom-right-radius: 2px;
      }
      .chat-bubble.ai {
        align-self: flex-start;
        background: #181825;
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom-left-radius: 2px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
      }

      .chat-bubble.ai .md-h2,
      .chat-bubble.ai .md-h3,
      .chat-bubble.ai .md-h4 {
        margin-top: 12px;
        margin-bottom: 4px;
        font-weight: 700;
        color: #a5b4fc;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .chat-bubble.ai .md-h2 { font-size: 15.5px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 4px; }
      .chat-bubble.ai .md-h3 { font-size: 14px; color: #818cf8; }
      .chat-bubble.ai .md-h4 { font-size: 13px; color: #a5b4fc; }

      .chat-bubble.ai .md-hr {
        border: none;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 12px 0;
      }

      .chat-bubble.ai .md-spacer {
        height: 6px;
      }

      .chat-bubble.ai .md-ol-item,
      .chat-bubble.ai .md-ul-item {
        display: flex;
        gap: 6px;
        margin-top: 4px;
        margin-bottom: 4px;
        align-items: flex-start;
        line-height: 1.5;
      }
      .chat-bubble.ai .md-num {
        font-weight: 700;
        color: #818cf8;
        min-width: 18px;
        flex-shrink: 0;
      }
      .chat-bubble.ai .md-bullet {
        color: #818cf8;
        font-weight: bold;
        flex-shrink: 0;
      }

      .chat-bubble.ai .inline-code {
        background: rgba(255, 255, 255, 0.08);
        color: #c7d2fe;
        padding: 1px 5px;
        border-radius: 4px;
        font-family: var(--mono, monospace);
        font-size: 12px;
      }

      .chat-bubble.ai .latex-math {
        background: rgba(168, 85, 247, 0.12);
        color: #e9d5ff;
        padding: 1px 5px;
        border-radius: 4px;
        font-family: var(--mono, monospace);
        font-size: 12px;
        font-weight: 600;
      }

      .chat-bubble.ai pre.code-block {
        margin: 8px 0;
        padding: 10px 12px;
        border-radius: 6px;
        overflow-x: auto;
        font-family: var(--mono, monospace);
        font-size: 12.5px;
        line-height: 1.5;
        color: #e2e8f0;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .chat-bubble.ai pre.code-block code {
        font-family: inherit;
        white-space: pre;
      }
      .chat-bubble.thinking {
        color: var(--text-dim);
        font-style: italic;
      }

      .chat-input-bar {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      .chat-input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(15, 15, 25, 0.6);
        color: var(--text);
        font-size: 13px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .chat-input:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }
      .send-btn {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: #ffffff;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        flex-shrink: 0;
      }
      .send-btn:hover:not(:disabled) {
        transform: translateY(-1px) scale(1.04);
        box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
        background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      }
      .send-btn:active:not(:disabled) {
        transform: scale(0.95);
      }
      .send-btn:disabled {
        background: rgba(255, 255, 255, 0.07);
        color: rgba(255, 255, 255, 0.25);
        box-shadow: none;
        cursor: not-allowed;
      }

      .form-group label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-dim);
        margin-bottom: 6px;
      }

      .status-grid {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .status-btn {
        flex: 1;
        min-width: 95px;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--bg-3);
        color: var(--text-dim);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
      }
      .status-btn.active {
        border-color: var(--accent);
        background: var(--accent-soft, rgba(91, 127, 255, 0.12));
        color: var(--accent);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      .slider {
        width: 100%;
        accent-color: var(--accent);
        cursor: pointer;
      }
      .input-num {
        width: 100%;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--bg-3);
        color: var(--text);
        font-size: 13px;
        box-sizing: border-box;
      }

      .flex-notes {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 90px;
      }

      .textarea-notes {
        flex: 1;
        width: 100%;
        min-height: 85px;
        height: 95px;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(15, 15, 25, 0.6);
        color: var(--text);
        font-size: 13px;
        line-height: 1.6;
        font-family: var(--mono, monospace);
        resize: vertical;
        box-sizing: border-box;
        overflow-wrap: break-word;
        word-break: break-word;
        white-space: pre-wrap;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .textarea-notes:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
      }

      .textarea-notes::placeholder {
        color: var(--text-faint, #5d6785);
        font-size: 12.5px;
      }

      .textarea-notes::-webkit-scrollbar {
        width: 6px;
      }
      .textarea-notes::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      .textarea-notes::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.18);
        border-radius: 4px;
      }
      .textarea-notes::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .toggles-row {
        display: flex;
        gap: 20px;
        font-size: 12px;
        color: var(--text);
        flex-shrink: 0;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }

      .modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 14px;
        border-top: 1px solid var(--border);
        flex-shrink: 0;
      }
      .right-actions {
        display: flex;
        gap: 10px;
      }
      .btn {
        padding: 8px 18px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        border: none;
        cursor: pointer;
      }
      .btn-secondary {
        background: var(--bg-3);
        color: var(--text);
      }
      .btn-primary {
        background: var(--accent);
        color: #fff;
      }
      .btn-danger {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
        transition: all 0.15s ease;
      }
      .btn-danger:hover {
        background: #ef4444;
        color: #ffffff;
      }
    `,
  ],
})
export class QuestionDetailModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() question: EnrichedQuestion | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('chatContainer') chatContainer?: ElementRef;
  @ViewChild('chatEnd') chatEnd?: ElementRef;

  private readonly progressService = inject(ProgressService);
  private readonly notesService = inject(NotesService);
  private readonly activityService = inject(ActivityService);
  private readonly toast = inject(ToastService);
  private readonly aiService = inject(AiService);

  readonly statusOptions: QuestionStatus[] = [
    'Not Started',
    'In Progress',
    'Solved',
    'Needs Revision',
    'Mastered',
  ];

  activeTab: 'notes' | 'ai' = 'notes';

  selectedStatus: QuestionStatus = 'Not Started';
  confidence = 0;
  attempts = 0;
  timeTaken = 0;
  notesText = '';
  needsRevision = false;
  isFavorite = false;

  // AI Chat state
  chatMessages: ChatMessage[] = [];
  customPrompt = '';
  isAiThinking = false;

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (this.chatEnd?.nativeElement) {
          this.chatEnd.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else if (this.chatContainer?.nativeElement) {
          this.chatContainer.nativeElement.scrollTo({
            top: this.chatContainer.nativeElement.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    });
  }

  private aiGreetingTimer?: any;
  private hasWelcomedCurrentQuestion = false;

  private playMessageSound(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // AudioContext autoplay restrictions catch
    }
  }

  private loadChatHistory(questionId: string | number): void {
    this.chatMessages = [];
    this.hasWelcomedCurrentQuestion = false;

    // 1. Check localstorage first for immediate offline availability
    const localKey = `dsa_tracker_ai_chat_${questionId}`;
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.chatMessages = parsed;
          this.hasWelcomedCurrentQuestion = true;
        }
      }
    } catch {}

    // 2. Cloud Sync (Spring Boot MySQL / Cloud Firestore)
    this.aiService.fetchChatFromCloud(questionId).subscribe(cloudMsgs => {
      if (cloudMsgs && cloudMsgs.length > 0) {
        this.chatMessages = cloudMsgs;
        this.hasWelcomedCurrentQuestion = true;
        try {
          localStorage.setItem(localKey, JSON.stringify(cloudMsgs));
        } catch {}
      }
    });
  }

  private saveChatHistory(): void {
    if (!this.question) return;

    // 1. LocalStorage Store
    const localKey = `dsa_tracker_ai_chat_${this.question.id}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(this.chatMessages));
    } catch {}

    // 2. Cloud Sync (MySQL DB & Firestore)
    this.aiService.saveChatToCloud(this.question.id, this.chatMessages);
  }

  selectTab(tab: 'notes' | 'ai'): void {
    this.activeTab = tab;
    if (tab === 'ai' && !this.hasWelcomedCurrentQuestion && this.chatMessages.length === 0) {
      this.scheduleAiWelcomeGreeting();
    }
  }

  private scheduleAiWelcomeGreeting(): void {
    if (this.aiGreetingTimer) {
      clearTimeout(this.aiGreetingTimer);
    }

    this.aiGreetingTimer = setTimeout(() => {
      if (this.chatMessages.length === 0) {
        this.chatMessages.push({
          sender: 'ai',
          text: 'Hi, I’m Beru — your AI companion to help you understand algorithms, not just memorize them, by mastering them through intuition, hints, and problem-solving.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        this.hasWelcomedCurrentQuestion = true;
        this.saveChatHistory();
        this.playMessageSound();
        this.scrollToBottom();
      }
    }, 2000); // 2 seconds delay
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['question'] && this.question) {
      if (this.aiGreetingTimer) {
        clearTimeout(this.aiGreetingTimer);
      }
      this.selectedStatus = this.question.status;
      this.attempts = this.question.attempts;
      this.timeTaken = this.question.timeTaken;
      this.needsRevision = this.question.revision;
      this.isFavorite = this.question.favorite;
      this.notesText = this.notesService.getNote(this.question.id);
      this.activeTab = 'notes';
      this.loadChatHistory(this.question.id);

      // Auto-compute or load confidence
      if (this.question.confidence > 0) {
        this.confidence = this.question.confidence;
      } else if (this.attempts > 0 || this.timeTaken > 0) {
        this.confidence = calculateConfidence(
          this.attempts,
          this.timeTaken,
          this.question.stars,
        );
      } else {
        this.confidence = 0;
      }
    }
  }

  get chatFormattedDate(): string {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day} ${time}`;
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
      case 'Solved':
        return '✅';
      case 'Mastered':
        return '🏆';
      case 'Needs Revision':
        return '🔁';
      case 'In Progress':
        return '⏳';
      default:
        return '⚪';
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
      this.confidence = calculateConfidence(
        this.attempts,
        this.timeTaken,
        this.question.stars,
      );
    }
  }

  onMetricsChange(): void {
    if (this.question) {
      this.confidence = calculateConfidence(
        this.attempts,
        this.timeTaken,
        this.question.stars,
      );
    }
  }

  // AI Chat Actions
  triggerAiAction(actionType: 'HINT' | 'APPROACH' | 'COMPLEXITY' | 'CODE_REVIEW'): void {
    if (!this.question || this.isAiThinking) return;

    let userLabel = '';
    switch (actionType) {
      case 'HINT': userLabel = '💡 Requested Hint 1'; break;
      case 'APPROACH': userLabel = '🧠 Requested Optimal Approach'; break;
      case 'COMPLEXITY': userLabel = '⏱️ Requested Target Complexity'; break;
      case 'CODE_REVIEW': userLabel = '🐛 Requested Code Review on Notes'; break;
    }

    this.chatMessages.push({
      sender: 'user',
      text: userLabel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.saveChatHistory();

    this.isAiThinking = true;
    this.scrollToBottom();

    this.aiService.askAiMentor({
      questionTitle: this.question.title,
      topic: this.question.topic,
      pattern: this.question.pattern,
      stars: this.question.stars,
      notesText: this.notesText,
      actionType: actionType
    }).subscribe({
      next: (res) => {
        this.isAiThinking = false;
        this.chatMessages.push({
          sender: 'ai',
          text: res.responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.saveChatHistory();
        this.playMessageSound();
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('AI Service Error:', err);
        this.isAiThinking = false;
        this.chatMessages.push({
          sender: 'ai',
          text: '⚠️ Something went wrong while getting your response. Please try again in a moment!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.saveChatHistory();
        this.playMessageSound();
        this.scrollToBottom();
      }
    });
  }

  sendCustomPrompt(): void {
    if (!this.question || !this.customPrompt.trim() || this.isAiThinking) return;

    const prompt = this.customPrompt.trim();
    this.customPrompt = '';

    this.chatMessages.push({
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.saveChatHistory();

    this.isAiThinking = true;
    this.scrollToBottom();

    this.aiService.askAiMentor({
      questionTitle: this.question.title,
      topic: this.question.topic,
      pattern: this.question.pattern,
      stars: this.question.stars,
      notesText: this.notesText,
      userPrompt: prompt,
      actionType: 'CUSTOM'
    }).subscribe({
      next: (res) => {
        this.isAiThinking = false;
        this.chatMessages.push({
          sender: 'ai',
          text: res.responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.saveChatHistory();
        this.playMessageSound();
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('AI Service Error:', err);
        this.isAiThinking = false;
        this.chatMessages.push({
          sender: 'ai',
          text: '⚠️ Something went wrong while getting your response. Please try again in a moment!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.saveChatHistory();
        this.playMessageSound();
        this.scrollToBottom();
      }
    });
  }

  formatMarkdown(text: string): string {
    if (!text) return '';

    // 1. Extract and preserve code blocks (to prevent internal replacement)
    const codeBlocks: string[] = [];
    let processed = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const languageClass = lang ? `language-${lang}` : '';
      const htmlCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const block = `<pre class="code-block ${languageClass}"><code>${htmlCode.trim()}</code></pre>`;
      codeBlocks.push(block);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 2. Escape HTML special characters in remaining text
    processed = processed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 3. Inline code `code`
    processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // 4. LaTeX math rendering: $O(N)$ or $O(N \log N)$
    processed = processed.replace(/\$([^\$]+)\$/g, '<span class="latex-math">$1</span>');

    // 5. Horizontal rule: --- or ***
    processed = processed.replace(/^[\-*_]{3,}$/gim, '<hr class="md-hr">');

    // 6. Headers: ###, ##, #
    processed = processed.replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
    processed = processed.replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    processed = processed.replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>');

    // 7. Bold & Italic
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 8. Numbered lists: 1. item, 2. item
    processed = processed.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div class="md-ol-item"><span class="md-num">$1.</span><span>$2</span></div>');

    // 9. Bullet lists: - item, * item
    processed = processed.replace(/^\s*[-•]\s+(.*$)/gim, '<div class="md-ul-item"><span class="md-bullet">•</span><span>$1</span></div>');

    // 10. Convert double newlines to paragraph breaks, single newlines to <br>
    processed = processed.replace(/\n\n/g, '<div class="md-spacer"></div>');
    processed = processed.replace(/\n/g, '<br>');

    // Clean up excessive <br> around block elements
    processed = processed.replace(/(<h[234][^>]*>|<hr[^>]*>|<div class="md-[^"]+">)<br>/gi, '$1');
    processed = processed.replace(/<br>(<h[234][^>]*>|<hr[^>]*>|<div class="md-[^"]+">)/gi, '$1');

    // 11. Restore code blocks
    processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_match, index) => {
      return codeBlocks[Number(index)] || '';
    });

    return processed;
  }

  resetQuestion(): void {
    if (!this.question) return;

    this.selectedStatus = 'Not Started';
    this.confidence = 0;
    this.attempts = 0;
    this.timeTaken = 0;
    this.notesText = '';
    this.needsRevision = false;
    this.isFavorite = false;

    this.progressService.resetQuestion(this.question.id);
    this.notesService.saveNote(this.question.id, '');
    this.aiService.deleteChatFromCloud(this.question.id);
    const localKey = `dsa_tracker_ai_chat_${this.question.id}`;
    try {
      localStorage.removeItem(localKey);
    } catch {}
    this.chatMessages = [];
    this.hasWelcomedCurrentQuestion = false;

    this.toast.show('Question progress reset to default!');
    this.saved.emit();
  }

  save(): void {
    if (!this.question) return;

    const wasSolvedBefore =
      this.question.status === 'Solved' || this.question.status === 'Mastered';
    const isNowSolved =
      this.selectedStatus === 'Solved' || this.selectedStatus === 'Mastered';

    this.progressService.updateProgress(this.question.id, {
      status: this.selectedStatus,
      confidence: this.confidence,
      attempts: this.attempts,
      timeTaken: this.timeTaken,
      revision: this.needsRevision,
      favorite: this.isFavorite,
      ...(isNowSolved && !wasSolvedBefore
        ? { lastSolved: new Date().toISOString().slice(0, 10) }
        : {}),
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
