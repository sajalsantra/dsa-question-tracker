import { Injectable, signal, inject, effect } from '@angular/core';
import { NotesRepository } from '../repositories/notes.repository';
import { LocalNotesRepository } from '../repositories/local/local-notes.repository';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly repo = inject(NotesRepository);
  private readonly storage = inject(StorageService);

  private readonly _notes = signal<Record<number, string>>({});
  readonly notes = this._notes.asReadonly();

  constructor() {
    effect(() => {
      const change = this.storage.guestStorageChanged();
      if (change.key && change.key.includes('notes') && this.storage.isGuest()) {
        this.load();
      }
    });
  }

  load(): void {
    this.repo.getAll().subscribe(all => this._notes.set(all));
  }

  getNote(questionId: number): string {
    return this._notes()[questionId] ?? '';
  }

  saveNote(questionId: number, text: string): void {
    this._notes.update(all => ({ ...all, [questionId]: text }));
    this.repo.save(questionId, text).subscribe();
  }

  resetAll(): void {
    this.repo.reset().subscribe(() => this._notes.set({}));
  }
}
