import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportImportService } from '../../core/services/export-import.service';
import { ProgressService } from '../../core/services/progress.service';
import { NotesService } from '../../core/services/notes.service';
import { ActivityService } from '../../core/services/activity.service';
import { QuestionService } from '../../core/services/question.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">💾 Data Management</h1>
        <p class="page-sub">Export your progress, backup notes, import datasets, or reset local storage</p>
      </div>

      <div class="actions-stack">

        <!-- Export Card -->
        <div class="card">
          <div class="card-title">📤 Export Data</div>
          <p class="card-desc">Download your complete progress, notes, and activity history.</p>
          <div class="btn-group">
            <button class="btn btn-primary" (click)="exportImportService.exportJSON()">
              📄 Export JSON (Complete Backup)
            </button>
            <button class="btn btn-secondary" (click)="exportImportService.exportCSV()">
              📊 Export CSV (Spreadsheet)
            </button>
          </div>
        </div>

        <!-- Import Card -->
        <div class="card">
          <div class="card-title">📥 Import Backup</div>
          <p class="card-desc">Restore progress from a previously exported JSON backup file.</p>
          <div class="file-input-wrap">
            <input type="file" #fileInput accept=".json" (change)="onFileSelected($event)" style="display:none" />
            <button class="btn btn-secondary" (click)="fileInput.click()">
              📁 Select JSON File to Import
            </button>
          </div>
        </div>

        <!-- Reset Card -->
        <div class="card danger-card">
          <div class="card-title text-danger">⚠️ Reset All Data</div>
          <p class="card-desc">Permanently erase all progress, notes, activity history, and custom goals.</p>
          <button class="btn btn-danger" (click)="isConfirmOpen = true">
            🗑️ Reset Everything
          </button>
        </div>

      </div>

      <!-- Reset Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="isConfirmOpen"
        title="Reset All Progress?"
        message="This action will permanently delete all your saved progress, notes, and streak data. This cannot be undone."
        confirmText="Yes, Reset Everything"
        [isDanger]="true"
        (confirm)="resetAll()"
        (cancel)="isConfirmOpen = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text); }
    .page-sub { font-size: 13px; color: var(--text-dim); margin-top: 4px; }

    .actions-stack { display: flex; flex-direction: column; gap: 16px; max-width: 600px; }
    .card { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
    .danger-card { border-color: rgba(240, 84, 107, 0.3); }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
    .text-danger { color: var(--red); }
    .card-desc { font-size: 12px; color: var(--text-dim); margin-bottom: 16px; }

    .btn-group { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-secondary { background: var(--bg-3); color: var(--text); }
    .btn-danger { background: var(--red); color: #fff; }
  `]
})
export class DataManagementComponent {
  readonly exportImportService = inject(ExportImportService);
  private readonly progressService = inject(ProgressService);
  private readonly notesService = inject(NotesService);
  private readonly activityService = inject(ActivityService);
  private readonly questionService = inject(QuestionService);
  private readonly toast = inject(ToastService);

  isConfirmOpen = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.exportImportService.importJSON(input.files[0]);
    }
  }

  resetAll(): void {
    const qIds = this.questionService.questions().map(q => q.id);
    this.progressService.resetAll(qIds);
    this.notesService.resetAll();
    this.activityService.resetAll();
    this.toast.show('All progress reset successfully');
    this.isConfirmOpen = false;
  }
}
