import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        @if (isForgotPassword) {
          <!-- Forgot Password View -->
          <div class="auth-header">
            <div class="brand-icon">🔑</div>
            <h2>Reset Password</h2>
            <p>Enter your account email to receive a password reset link.</p>
          </div>

          <form (ngSubmit)="sendPasswordReset()" class="auth-form">
            <div class="form-group">
              <label>Email Address</label>
              <input
                type="email"
                [(ngModel)]="resetEmail"
                name="resetEmail"
                required
                class="input"
                placeholder="user@example.com"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Send Reset Link
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-block"
              (click)="isForgotPassword = false"
            >
              Back to Sign In
            </button>
          </form>
        } @else {
          <!-- Sign In / Sign Up View -->
          <div class="auth-header">
            <div class="brand-icon">&lt;/&gt;</div>
            <h2>DSA Tracker</h2>
            <p>
              {{
                isSignUp ? 'Create a new account' : 'Sign in to your account'
              }}
            </p>
          </div>

          <!-- Social Login Buttons -->
          <div class="social-buttons">
            <button
              type="button"
              class="btn btn-social"
              (click)="loginWithGoogle()"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              class="btn btn-social"
              (click)="loginWithGithub()"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                />
              </svg>
              GitHub
            </button>
          </div>

          <div class="divider"><span>OR</span></div>

          <form (ngSubmit)="onSubmit()" class="auth-form">
            @if (isSignUp) {
              <div class="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  [(ngModel)]="name"
                  name="name"
                  required
                  class="input"
                  placeholder="Enter Your Name"
                />
              </div>
            }

            <div class="form-group">
              <label>Email Address</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                class="input"
                placeholder="user@example.com"
              />
            </div>

            <div class="form-group">
              <div class="label-row">
                <label>Password</label>
                @if (!isSignUp) {
                  <button
                    type="button"
                    class="forgot-link"
                    (click)="isForgotPassword = true"
                  >
                    Forgot Password?
                  </button>
                }
              </div>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                class="input"
                placeholder="••••••••"
              />
            </div>

            @if (isSignUp) {
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    [(ngModel)]="syncGuestData"
                    name="syncGuestData"
                  />
                  <span>Sync current progress & notes to your account</span>
                </label>
              </div>
            }

            <button type="submit" class="btn btn-primary btn-block">
              {{ isSignUp ? 'Create Account' : 'Sign In' }}
            </button>
          </form>

          <div class="auth-footer">
            <button class="toggle-btn" (click)="isSignUp = !isSignUp">
              {{
                isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"
              }}
            </button>
            <div class="back-link">
              <a routerLink="/dashboard">← Back to Dashboard</a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg);
        padding: 20px;
      }
      .auth-card {
        width: 100%;
        max-width: 400px;
        padding: 32px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 16px;
      }
      .auth-header {
        text-align: center;
        margin-bottom: 24px;
      }
      .brand-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--accent);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        margin: 0 auto 12px;
        font-size: 16px;
      }
      .auth-header h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--text);
      }
      .auth-header p {
        font-size: 12px;
        color: var(--text-dim);
        margin-top: 4px;
      }

      .social-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
      }
      .btn-social {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        border: 1px solid var(--border);
        background: var(--bg-3);
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .btn-social:hover {
        background: var(--bg-card-hover, rgba(255, 255, 255, 0.05));
      }

      .divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin-bottom: 16px;
        color: var(--text-dim);
        font-size: 11px;
      }
      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--border);
      }
      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-group:not(.checkbox-group) label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-dim);
      }
      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .forgot-link {
        background: none;
        border: none;
        font-size: 11px;
        color: var(--accent);
        cursor: pointer;
        text-decoration: underline;
      }
      .checkbox-group {
        margin-top: 2px;
      }
      .checkbox-group .checkbox-label {
        display: inline-flex !important;
        align-items: center !important;
        gap: 10px !important;
        font-size: 12.5px !important;
        font-weight: 500 !important;
        color: var(--text-dim) !important;
        cursor: pointer;
      }
      .checkbox-group .checkbox-label input[type='checkbox'] {
        margin-right: 0px !important;
      }

      .input {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--bg-3);
        color: var(--text);
        font-size: 13px;
        box-sizing: border-box;
      }
      .btn-block {
        width: 100%;
        padding: 11px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        border: none;
        cursor: pointer;
      }
      .btn-primary {
        background: var(--accent);
        color: #fff;
      }
      .btn-secondary {
        background: var(--bg-3);
        color: var(--text);
        border: 1px solid var(--border);
      }

      .auth-footer {
        text-align: center;
        margin-top: 20px;
        font-size: 12px;
      }
      .toggle-btn {
        background: none;
        border: none;
        color: var(--accent);
        cursor: pointer;
      }
      .back-link {
        margin-top: 12px;
      }
      .back-link a {
        color: var(--text-dim);
        text-decoration: none;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  isSignUp = false;
  isForgotPassword = false;
  syncGuestData = true;
  name = '';
  email = '';
  password = '';
  resetEmail = '';

  loginWithGoogle(): void {
    const returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.toast.show('Signed in with Google successfully!');
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) =>
        this.toast.show(err.message || 'Google Sign-In failed', 'error'),
    });
  }

  loginWithGithub(): void {
    const returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.authService.loginWithGithub().subscribe({
      next: () => {
        this.toast.show('Signed in with GitHub successfully!');
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) =>
        this.toast.show(err.message || 'GitHub Sign-In failed', 'error'),
    });
  }

  sendPasswordReset(): void {
    if (!this.resetEmail) {
      this.toast.show('Please enter your email address', 'error');
      return;
    }
    this.authService.sendPasswordResetEmail(this.resetEmail).subscribe({
      next: () => {
        this.toast.show('Password reset link sent to your email!');
        this.isForgotPassword = false;
      },
      error: (err) =>
        this.toast.show(err.message || 'Failed to send reset link', 'error'),
    });
  }

  onSubmit(): void {
    const returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    if (this.isSignUp) {
      this.authService
        .register(this.name, this.email, this.password, this.syncGuestData)
        .subscribe({
          next: () => {
            this.toast.show('Account created successfully!');
            this.router.navigateByUrl(returnUrl);
          },
          error: (err) => this.toast.show(err.message, 'error'),
        });
    } else {
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.toast.show('Signed in successfully!');
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => this.toast.show(err.message, 'error'),
      });
    }
  }
}
