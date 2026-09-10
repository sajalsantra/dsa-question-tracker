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
  email = 'sajal@example.com';
  password = 'password123';

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
