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
        <div class="auth-header">
          <div class="brand-icon">&lt;/&gt;</div>
          <h2>DSA Tracker</h2>
          <p>{{ isSignUp ? 'Create a new account' : 'Sign in to your account' }}</p>
        </div>

        <button type="button" class="btn btn-google" (click)="loginWithGoogle()">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          Sign in with Google
        </button>

        <div class="divider"><span>OR</span></div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          @if (isSignUp) {
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="name" name="name" required class="input" placeholder="Sajal Santra" />
            </div>
          }

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" required class="input" placeholder="user@example.com" />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required class="input" placeholder="••••••••" />
          </div>

          <button type="submit" class="btn btn-primary btn-block">
            {{ isSignUp ? 'Create Account' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          <button class="toggle-btn" (click)="isSignUp = !isSignUp">
            {{ isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up" }}
          </button>
          <div class="back-link">
            <a routerLink="/dashboard">← Back to Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
    .auth-header { text-align: center; margin-bottom: 24px; }
    .brand-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: var(--accent); color: #fff; display: flex;
      align-items: center; justify-content: center; font-weight: 700;
      margin: 0 auto 12px; font-size: 16px;
    }
    .auth-header h2 { font-size: 20px; font-weight: 700; color: var(--text); }
    .auth-header p { font-size: 12px; color: var(--text-dim); margin-top: 4px; }

    .btn-google {
      width: 100%; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 600;
      border: 1px solid var(--border); background: var(--bg-3); color: var(--text);
      display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;
      margin-bottom: 16px; transition: background 0.15s ease;
    }
    .btn-google:hover { background: var(--bg-card-hover, rgba(255,255,255,0.05)); }

    .divider {
      display: flex; align-items: center; text-align: center; margin-bottom: 16px; color: var(--text-dim); font-size: 11px;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; border-bottom: 1px solid var(--border);
    }
    .divider span { padding: 0 10px; }

    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-dim); margin-bottom: 6px; }
    .input {
      width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-3); color: var(--text); font-size: 13px;
    }
    .btn-block { width: 100%; padding: 11px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; background: var(--accent); color: #fff; cursor: pointer; }

    .auth-footer { text-align: center; margin-top: 20px; font-size: 12px; }
    .toggle-btn { background: none; border: none; color: var(--accent); cursor: pointer; }
    .back-link { margin-top: 12px; }
    .back-link a { color: var(--text-dim); text-decoration: none; }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  isSignUp = false;
  name = '';
  email = '';
  password = '';

  loginWithGoogle(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.toast.show('Signed in with Google successfully!');
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => this.toast.show(err.message || 'Google Sign-In failed', 'error')
    });
  }

  onSubmit(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    if (this.isSignUp) {
      this.authService.register(this.name, this.email, this.password).subscribe({
        next: () => {
          this.toast.show('Account created successfully!');
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => this.toast.show(err.message, 'error')
      });
    } else {
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.toast.show('Signed in successfully!');
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => this.toast.show(err.message, 'error')
      });
    }
  }
}
