import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuestAuthPopupService } from '../../../core/services/guest-auth-popup.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-guest-auth-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (popupService.isOpen() && !authService.isAuthenticated()) {
      <div
        class="popup-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-popup-title"
        aria-describedby="guest-popup-desc"
        (click)="onBackdropClick($event)"
      >
        <div class="popup-card" (click)="$event.stopPropagation()">
          <!-- Close (×) Control -->
          <button
            type="button"
            class="close-btn"
            (click)="popupService.close()"
            aria-label="Close authentication prompt"
            title="Dismiss popup"
            #closeBtn
          >
            ✕
          </button>

          <!-- Icon Badge -->
          <div class="icon-badge">
            <span class="icon">🔒</span>
          </div>

          <!-- Title -->
          <h2 id="guest-popup-title" class="popup-title">
            @if (popupService.featureName()) {
              Unlock {{ popupService.featureName() }}
            } @else {
              Authentication Required
            }
          </h2>

          <!-- Clear Message -->
          <p id="guest-popup-desc" class="popup-message">
            {{ popupService.message() }}
          </p>

          <!-- Controls (Log In, Register) -->
          <div class="popup-actions">
            <button
              type="button"
              class="btn btn-primary"
              (click)="popupService.navigateToLogin()"
            >
              🔑 Log In
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              (click)="popupService.navigateToRegister()"
            >
              ✨ Register
            </button>
          </div>

          <div class="popup-footer-hint">
            <span class="hint-bullet">🛡️</span>
            <span>Guest progress is preserved on this device. Sign up anytime to sync to the cloud.</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .popup-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(10, 14, 23, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fadeIn 0.15s ease-out;
    }

    .popup-card {
      position: relative;
      width: 100%;
      max-width: 440px;
      background: var(--bg-2, #161b22);
      border: 1px solid var(--border, #30363d);
      border-radius: var(--radius, 12px);
      padding: 28px 24px 20px 24px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 8px;
      color: var(--text-dim, #8b949e);
      font-size: 15px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .close-btn:hover, .close-btn:focus-visible {
      background: var(--bg-3, #21262d);
      color: var(--text, #c9d1d9);
      border-color: var(--border, #30363d);
      outline: none;
    }

    .icon-badge {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .icon {
      font-size: 24px;
    }

    .popup-title {
      font-size: 19px;
      font-weight: 700;
      color: var(--text, #f0f6fc);
      margin: 0 0 10px 0;
      letter-spacing: -0.02em;
    }

    .popup-message {
      font-size: 13.5px;
      line-height: 1.55;
      color: var(--text-dim, #8b949e);
      margin: 0 0 24px 0;
      padding: 0 8px;
    }

    .popup-actions {
      display: flex;
      gap: 12px;
      width: 100%;
    }

    .btn {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.15s ease;
      min-height: 42px;
    }
    .btn:focus-visible {
      outline: 2px solid var(--accent, #6366f1);
      outline-offset: 2px;
    }

    .btn-primary {
      background: var(--accent, #6366f1);
      color: #ffffff;
      border: none;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
    }
    .btn-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--bg-3, #21262d);
      color: var(--text, #c9d1d9);
      border: 1px solid var(--border, #30363d);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .popup-footer-hint {
      margin-top: 18px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: var(--text-dim, #6e7681);
      line-height: 1.4;
      text-align: center;
    }
    .hint-bullet {
      font-size: 12px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @media (max-width: 480px) {
      .popup-card {
        padding: 24px 18px 18px 18px;
      }
      .popup-actions {
        flex-direction: column;
        gap: 10px;
      }
      .btn {
        width: 100%;
      }
    }
  `]
})
export class GuestAuthPopupComponent {
  readonly popupService = inject(GuestAuthPopupService);
  readonly authService = inject(AuthService);

  @ViewChild('closeBtn') closeBtnRef?: ElementRef<HTMLButtonElement>;

  constructor() {
    // Automatically close if the user becomes authenticated (e.g., in another tab)
    effect(() => {
      if (this.authService.isAuthenticated() && this.popupService.isOpen()) {
        this.popupService.close();
      }
    });
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.popupService.isOpen()) {
      this.popupService.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.popupService.close();
    }
  }
}
