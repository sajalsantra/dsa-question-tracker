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
                >
                  Send ➔
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
        height: 570px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
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
        overflow-y: auto;
        padding: 16px 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
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
      .empty-chat {
        font-size: 13px;
        color: var(--text-dim);
        text-align: center;
        margin: auto;
        padding: 20px;
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
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-bottom-left-radius: 2px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
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
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--bg-3);
        color: var(--text);
        font-size: 13px;
      }
      .send-btn {
        padding: 10px 18px;
        background: var(--accent);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
      .send-btn:disabled {
        opacity: 0.5;
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
        min-height: 0;
      }

      .textarea-notes {
        flex: 1;
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--bg-3);
        color: var(--text);
        font-size: 12px;
        font-family: var(--mono, monospace);
        resize: none;
        box-sizing: border-box;
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
      this.chatMessages = [];
      this.hasWelcomedCurrentQuestion = false;
      this.activeTab = 'notes';

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
        this.playMessageSound();
        this.scrollToBottom();
      },
      error: (err) => {
        this.isAiThinking = false;
        this.chatMessages.push({
          sender: 'ai',
          text: `⚠️ Error fetching AI response: ${err.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
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
        this.playMessageSound();
        this.scrollToBottom();
      },
      error: (err) => {
        this.isAiThinking = false;
        this.chatMessages.push({
          sender: 'ai',
          text: `⚠️ Error fetching AI response: ${err.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.playMessageSound();
        this.scrollToBottom();
      }
    });
  }

  formatMarkdown(text: string): string {
    if (!text) return '';

    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```lang ... ```
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const languageClass = lang ? `language-${lang}` : '';
      return `<pre class="code-block ${languageClass}"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // LaTeX math rendering: $\mathcal{O}(n)$ or $O(n \log n)$
    html = html.replace(/\$([^\$]+)\$/g, '<span class="latex-math">$1</span>');

    // Headers ### Header
    html = html.replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>');

    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Bullet points - item
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="md-li">$1</li>');

    // Paragraph breaks
    html = html.replace(/\n\n/g, '<br><br>');

    return html;
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
