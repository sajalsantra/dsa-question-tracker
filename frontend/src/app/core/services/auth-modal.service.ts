import { Injectable, signal } from '@angular/core';

export type AuthMode = 'signin' | 'signup';

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {
  readonly isOpen = signal(false);
  readonly mode = signal<AuthMode>('signin');

  open(initialMode: AuthMode = 'signin'): void {
    this.mode.set(initialMode);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  setMode(newMode: AuthMode): void {
    this.mode.set(newMode);
  }
}
