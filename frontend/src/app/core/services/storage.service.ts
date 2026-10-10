import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

export type StorageKey = 'progress' | 'notes' | 'activity' | 'goal' | 'settings';

export interface PendingMutation {
  id: string;
  type: 'PROGRESS' | 'NOTE' | 'ACTIVITY' | 'GOAL' | 'SETTINGS';
  action: 'SAVE' | 'DELETE' | 'RESET';
  payload?: any;
  timestamp: string;
}

export interface GuestDataSnapshot {
  progress: Record<number, any>;
  notes: Record<number, string>;
  activity: Record<string, number>;
  goal?: any;
  settings?: any;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly TOKEN_KEY = 'dsa_auth_access_token';
  private readonly REFRESH_TOKEN_KEY = 'dsa_auth_refresh_token';
  private readonly USER_PROFILE_KEY = 'dsa_auth_user';

  // Browser Session Marker & Multi-Tab Coordination Keys
  private readonly BROWSER_SESSION_COOKIE = 'dsa_browser_session_active';
  private readonly TAB_HEARTBEAT_KEY = 'dsa_active_guest_tabs';
  private readonly tabId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  private activeUserId: string | null = null;
  readonly isGuest = signal<boolean>(true);

  // Reactive signal notifying other tabs of guest storage changes
  readonly guestStorageChanged = signal<{ key: string; timestamp: number }>({
    key: '',
    timestamp: 0
  });

  constructor() {
    this.initializeSessionStrategy();
  }

  /**
   * Robust Guest Session Lifecycle Strategy:
   * 1. Guest data is stored in localStorage under 'dsa_guest_*' so:
   *    - Page refresh (F5) preserves guest progress.
   *    - Closing an individual tab does NOT clear guest progress.
   *    - Multiple tabs share and see consistent guest progress.
   * 2. A non-persistent browser-session cookie ('dsa_browser_session_active') acts as the browser session marker:
   *    - In-memory session cookies are discarded by browser engines when all browser windows are closed.
   *    - When the browser is reopened, the absence of the cookie signals a fresh browser session.
   *    - Transient guest data from previous sessions is then safely cleaned up.
   * 3. Authenticated user data ('dsa_user_*', 'dsa_auth_*') is NEVER deleted during guest cleanup.
   */
  private initializeSessionStrategy(): void {
    const existingUser = this.getCachedUser();

    if (existingUser && existingUser.id) {
      this.activeUserId = existingUser.id;
      this.isGuest.set(false);
      // Authenticated user session active: never run guest cleanup
      return;
    }

    this.activeUserId = null;
    this.isGuest.set(true);

    const hasSessionMarker = this.hasBrowserSessionMarker();

    if (!hasSessionMarker) {
      // Fresh browser startup detected: clear previous transient guest data
      this.clearGuestData();
      // Set the session cookie marker for this new browser session
      this.setBrowserSessionMarker();
    } else {
      // Existing browser session: preserve guest progress across tabs and refreshes
      this.setBrowserSessionMarker();
    }

    this.setupTabCoordination();
  }

  private hasBrowserSessionMarker(): boolean {
    if (typeof document === 'undefined') return true;
    return document.cookie
      .split(';')
      .some(cookie => cookie.trim().startsWith(`${this.BROWSER_SESSION_COOKIE}=`));
  }

  private setBrowserSessionMarker(): void {
    if (typeof document === 'undefined') return;
    // Session cookie without Expires or Max-Age: cleared when the browser terminates
    document.cookie = `${this.BROWSER_SESSION_COOKIE}=1; path=/; SameSite=Lax`;
  }

  /**
   * Coordinates multi-tab guest state and tracks active tabs.
   * Closing an individual tab only unregisters that tab's heartbeat without deleting data.
   */
  private setupTabCoordination(): void {
    if (typeof window === 'undefined') return;

    this.registerTab();

    // Heartbeat every 5 seconds
    setInterval(() => {
      if (this.isGuest()) {
        this.registerTab();
      }
    }, 5000);

    const onTabDismissal = () => {
      if (this.isGuest()) {
        this.unregisterTab();
      }
    };

    window.addEventListener('beforeunload', onTabDismissal);
    window.addEventListener('pagehide', onTabDismissal);

    // Multi-tab sync via storage events
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key && event.key.startsWith('dsa_guest_')) {
        this.guestStorageChanged.set({
          key: event.key,
          timestamp: Date.now()
        });
      }
    });
  }

  private registerTab(): void {
    try {
      const tabs = this.getActiveTabs();
      tabs[this.tabId] = Date.now();
      localStorage.setItem(this.TAB_HEARTBEAT_KEY, JSON.stringify(tabs));
    } catch {}
  }

  private unregisterTab(): void {
    try {
      const tabs = this.getActiveTabs();
      delete tabs[this.tabId];
      if (Object.keys(tabs).length === 0) {
        localStorage.removeItem(this.TAB_HEARTBEAT_KEY);
      } else {
        localStorage.setItem(this.TAB_HEARTBEAT_KEY, JSON.stringify(tabs));
      }
    } catch {}
  }

  private getActiveTabs(): Record<string, number> {
    try {
      const raw = localStorage.getItem(this.TAB_HEARTBEAT_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const now = Date.now();
      const valid: Record<string, number> = {};
      for (const [id, ts] of Object.entries(parsed)) {
        if (typeof ts === 'number' && now - ts < 15000) {
          valid[id] = ts;
        }
      }
      return valid;
    } catch {
      return {};
    }
  }

  private clearLegacyGuestKeys(): void {
    const legacyKeys = ['dsaProgress', 'dsaNotes', 'dsaActivity', 'dsaDailyGoal', 'dsaSettings'];
    legacyKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  }

  // --- Auth & Session State ---

  setAuthenticatedUser(user: User | null, accessToken?: string, refreshToken?: string): void {
    if (user && user.id) {
      this.activeUserId = user.id;
      this.isGuest.set(false);
      localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(user));
      if (accessToken) {
        localStorage.setItem(this.TOKEN_KEY, accessToken);
      }
      if (refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
    } else {
      this.clearAuth();
    }
  }

  clearAuth(): void {
    this.activeUserId = null;
    this.isGuest.set(true);
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_PROFILE_KEY);
    } catch {}
    this.clearGuestData();
  }

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setAccessToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch {}
  }

  getCachedUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    return this.activeUserId;
  }

  // --- Storage Routing (Shared localStorage with strictly separated namespaces) ---

  private resolveKey(key: StorageKey): { storage: Storage; storageKey: string } {
    if (this.isGuest() || !this.activeUserId) {
      return {
        storage: localStorage,
        storageKey: `dsa_guest_${key}`
      };
    } else {
      return {
        storage: localStorage,
        storageKey: `dsa_user_${this.activeUserId}_${key}`
      };
    }
  }

  getData<T>(key: StorageKey): T | null {
    const { storage, storageKey } = this.resolveKey(key);
    try {
      const raw = storage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as T;

      // Backward compatibility check for legacy keys in guest mode
      if (this.isGuest()) {
        const legacy = localStorage.getItem(`dsa${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (legacy) return JSON.parse(legacy) as T;
      }
      return null;
    } catch {
      return null;
    }
  }

  setData<T>(key: StorageKey, value: T): void {
    const { storage, storageKey } = this.resolveKey(key);
    try {
      storage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      console.warn(`StorageService failed to persist ${storageKey}:`, e);
    }
  }

  removeData(key: StorageKey): void {
    const { storage, storageKey } = this.resolveKey(key);
    try {
      storage.removeItem(storageKey);
    } catch {}
  }

  /**
   * Cleans only transient guest data.
   * Safety Guarantee: Never touches authenticated user keys (dsa_user_*, dsa_auth_*).
   */
  clearGuestData(): void {
    // Safety Guard: Abort if user is authenticated
    if (!this.isGuest() || this.activeUserId) {
      console.warn('Safety guard: Aborted guest cleanup because an authenticated user is active.');
      return;
    }

    const guestKeys = [
      'dsa_guest_progress',
      'dsa_guest_notes',
      'dsa_guest_activity',
      'dsa_guest_goal',
      'dsa_guest_settings'
    ];

    guestKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      } catch {}
    });

    this.clearLegacyGuestKeys();
  }

  getGuestSnapshot(): GuestDataSnapshot {
    return {
      progress: this.getData<Record<number, any>>('progress') || {},
      notes: this.getData<Record<number, string>>('notes') || {},
      activity: this.getData<Record<string, number>>('activity') || {},
      goal: this.getData<any>('goal'),
      settings: this.getData<any>('settings')
    };
  }

  // --- Offline Mutation Queue (Per Account) ---

  private getQueueKey(): string {
    const uid = this.activeUserId || 'guest';
    return `dsa_user_${uid}_pending_sync`;
  }

  getPendingMutations(): PendingMutation[] {
    try {
      const raw = localStorage.getItem(this.getQueueKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  queueOfflineMutation(mutation: PendingMutation): void {
    if (this.isGuest()) return; // Guests do not push to remote MySQL
    try {
      const current = this.getPendingMutations();
      current.push(mutation);
      localStorage.setItem(this.getQueueKey(), JSON.stringify(current));
    } catch {}
  }

  clearPendingMutations(): void {
    try {
      localStorage.removeItem(this.getQueueKey());
    } catch {}
  }
}
