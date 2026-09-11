import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast" [class]="t.type">
          <span>{{ t.message }}</span>
          <button class="dismiss-btn" (click)="toastService.dismiss(t.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
    }
    .toast {
      padding: 12px 16px;
      border-radius: 10px;
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.2s ease-out;
    }
    .toast.success { background: #10B981; }
    .toast.error { background: #EF4444; }
    .toast.info { background: #3B82F6; }
    .dismiss-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 14px;
      opacity: 0.8;
      padding: 0;
    }
    .dismiss-btn:hover { opacity: 1; }
    @keyframes slideIn {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
