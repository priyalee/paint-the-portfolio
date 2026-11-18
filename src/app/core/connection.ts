import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiStatus, onNetworkError } from '@core/api';

/** How often to look for the connection again while offline. */
const RETRY_EVERY_MS = 5_000;
/** How long "Back online" stays up. */
const BACK_ONLINE_MS = 3_000;

/**
 * Watches the visitor's connection once the site has loaded.
 *
 * Goes offline on the browser's `offline` event, or when a request fails and a
 * tiny check request confirms the site can't be reached (so one slow request
 * isn't a false alarm). While offline it re-checks every few seconds and on
 * the browser's `online` event. When the connection returns it shows "Back
 * online" briefly, re-checks the backend and finishes a page change that
 * failed while offline.
 */
@Injectable({ providedIn: 'root' })
export class Connection {
  private readonly api = inject(ApiStatus);
  private readonly router = inject(Router);

  /** 'online', 'offline', or 'back' (just reconnected; shown briefly). */
  readonly state = signal<'online' | 'offline' | 'back'>(navigator.onLine ? 'online' : 'offline');
  /** A check is running (for the banner's "Checking…"). */
  readonly checking = signal(false);

  private pendingUrl: string | null = null;
  private retryTimer?: ReturnType<typeof setInterval>;
  private backTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    onNetworkError(() => void this.confirmLost());
    const lost = () => this.goOffline();
    const maybeBack = () => void this.tryNow();
    addEventListener('offline', lost);
    addEventListener('online', maybeBack);
    if (this.state() === 'offline') this.goOffline();
    inject(DestroyRef).onDestroy(() => {
      removeEventListener('offline', lost);
      removeEventListener('online', maybeBack);
      clearInterval(this.retryTimer);
      clearTimeout(this.backTimer);
      onNetworkError(null);
    });
  }

  get offline(): boolean {
    return this.state() === 'offline';
  }

  /** Remember a page the visitor tried to open while offline; it opens once the connection is back. */
  retryNavigationLater(url: string): void {
    this.pendingUrl = url;
    this.goOffline();
  }

  /** Checks the connection right away (the banner's "Try again", or the browser's `online` event). */
  async tryNow(): Promise<boolean> {
    if (this.checking()) return false;
    this.checking.set(true);
    const ok = await reachable();
    this.checking.set(false);
    if (ok) this.goOnline();
    else this.goOffline();
    return ok;
  }

  /** A request failed: confirm with a small check before telling the visitor. */
  async confirmLost(): Promise<void> {
    if (this.offline) return;
    if (!(await reachable())) this.goOffline();
  }

  private goOffline(): void {
    clearTimeout(this.backTimer);
    this.state.set('offline');
    if (!this.retryTimer) this.retryTimer = setInterval(() => void this.tryNow(), RETRY_EVERY_MS);
  }

  private goOnline(): void {
    clearInterval(this.retryTimer);
    this.retryTimer = undefined;
    if (this.state() !== 'offline') return;
    this.state.set('back');
    this.backTimer = setTimeout(() => this.state.set('online'), BACK_ONLINE_MS);
    // The backend check may have given up while offline: ask again.
    if (!this.api.available()) void this.api.check();
    const url = this.pendingUrl;
    this.pendingUrl = null;
    if (url) void this.router.navigateByUrl(url);
  }
}

/** True when the site itself answers (a tiny uncached file, 5 s at most). */
async function reachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    // Any answer at all means the site is reachable.
    await fetch(`/robots.txt?ping=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
