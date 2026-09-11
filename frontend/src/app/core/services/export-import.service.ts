import { Injectable, inject } from '@angular/core';
import { EnrichedQuestion } from '../models/progress.model';
import { QuestionService } from './question.service';
import { ProgressService } from './progress.service';
import { NotesService } from './notes.service';
import { ActivityService } from './activity.service';
import { SettingsService } from './settings.service';
import { FilterService } from './filter.service';
import { ToastService } from './toast.service';

interface ExportData {
  progress: Record<number, unknown>;
  notes: Record<number, string>;
  activity: Record<string, number>;
  dailyGoal: unknown;
  exportedAt: string;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class ExportImportService {
  private readonly questionService = inject(QuestionService);
  private readonly progressService = inject(ProgressService);
  private readonly notesService = inject(NotesService);
  private readonly activityService = inject(ActivityService);
  private readonly settingsService = inject(SettingsService);
  private readonly filterService = inject(FilterService);
  private readonly toast = inject(ToastService);

  exportJSON(): void {
    const data: ExportData = {
      progress: this.progressService.progress() as Record<number, unknown>,
      notes: this.notesService.notes(),
      activity: this.activityService.activity(),
      dailyGoal: this.activityService.dailyGoal(),
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    this.downloadFile('dsa-progress.json', JSON.stringify(data, null, 2), 'application/json');
    this.toast.show('Progress exported as JSON');
  }

  exportCSV(): void {
    const progress = this.progressService.progress();
    const notes = this.notesService.notes();
    const headers = ['ID', 'Title', 'Platform', 'Topic', 'Pattern', 'Stars', 'Status',
      'Confidence', 'Attempts', 'TimeTaken', 'LastSolved', 'Favorite', 'Revision', 'Notes'];

    const rows = this.filterService.enrichedQuestions().map((q: EnrichedQuestion) => [
      q.id, q.title, q.platform, q.topic, q.pattern, q.stars,
      q.status, q.confidence, q.attempts, q.timeTaken,
      q.lastSolved ?? '', q.favorite, q.revision,
      (notes[q.id] ?? '').replace(/\n/g, ' ')
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    this.downloadFile('dsa-progress.csv', csv, 'text/csv');
    this.toast.show('Progress exported as CSV');
  }

  importJSON(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result as string;
        const data = JSON.parse(raw) as Partial<ExportData>;
        this.applyImport(data);
        this.toast.show('Progress imported successfully');
      } catch {
        this.toast.show('Import failed: invalid file format', 'error');
      }
    };
    reader.onerror = () => this.toast.show('Failed to read file', 'error');
    reader.readAsText(file);
  }

  private applyImport(data: Partial<ExportData>): void {
    if (data.progress && typeof data.progress === 'object') {
      // Validate and apply each progress entry
      const validIds = new Set(this.questionService.questions().map(q => q.id));
      for (const [idStr, p] of Object.entries(data.progress)) {
        const id = Number(idStr);
        if (validIds.has(id) && p && typeof p === 'object') {
          this.progressService.updateProgress(id, p as never);
        }
      }
    }

    if (data.notes && typeof data.notes === 'object') {
      for (const [idStr, note] of Object.entries(data.notes)) {
        const id = Number(idStr);
        if (typeof note === 'string') {
          this.notesService.saveNote(id, note);
        }
      }
    }

    if (data.activity && typeof data.activity === 'object') {
      for (const [date, count] of Object.entries(data.activity)) {
        if (typeof count === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          this.activityService['repo'].saveActivity(date, count).subscribe();
        }
      }
      this.activityService.load();
    }
  }

  private downloadFile(name: string, content: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
