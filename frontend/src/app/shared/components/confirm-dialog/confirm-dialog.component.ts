import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-overlay" (click)="cancel.emit()">
        <div class="modal-card dialog-card" (click)="$event.stopPropagation()">
          <h3 class="dialog-title">{{ title }}</h3>
          <p class="dialog-msg">{{ message }}</p>

          <div class="dialog-actions">
            <button class="btn btn-secondary" (click)="cancel.emit()">Cancel</button>
            <button class="btn" [class.btn-danger]="isDanger" [class.btn-primary]="!isDanger" (click)="confirm.emit()">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-card {
      max-width: 400px;
    }
    .dialog-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
    }
    .dialog-msg {
      font-size: 13px;
      color: var(--text-dim);
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      border: none;
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
      background: var(--red);
      color: #fff;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() isDanger = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
