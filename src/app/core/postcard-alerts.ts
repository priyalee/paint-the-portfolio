import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ApiResult, ApiStatus, api } from '@core/api';

export interface WaitingPostcard {
  id: string;
  from: string;
  message: string;
  createdAt: number;
}

/** Anything that can make signed-in admin calls (the /admin session). */
interface AdminCaller {
  call<T>(path: string): Promise<ApiResult<T>>;
}

const KEY = 'ink-pigment:postcard-alerts';
const OFF = 'ink-pigment:postcard-alerts-off';
const SEEN = 'ink-pigment:postcard-alerts-seen';
/** How often an open tab checks for new postcards. */
const EVERY_MS = 60_000;

/**
 * The owner's postcard bell. Signing in to /admin gives this device a
 * read-only alert key (never the admin key itself); with it the site checks
 * every minute for postcards waiting for review. Visitors never have a key,
 * so they never see the bell.
 *
 * The bell shows only while there are postcards the owner hasn't clicked
 * through to yet, and stays (even across reloads) until they click it.
 */
@Injectable({ providedIn: 'root' })
export class PostcardAlerts {
  private readonly apiUp = inject(ApiStatus).available;
  private readonly key = signal(read(KEY));

  /** This device shows the bell. */
  readonly enabled = computed(() => this.apiUp() && !!this.key());
  /** All postcards waiting for review. */
  readonly waiting = signal(0);
  /** Waiting postcards that arrived after the owner last clicked the bell. */
  readonly fresh = signal(0);
  readonly latest = signal<WaitingPostcard[]>([]);
  /** Send time of the newest waiting postcard. */
  private readonly newest = signal(0);
  /** Newest postcard the owner has already clicked through to (by time sent). */
  private readonly seenAt = signal(Number(read(SEEN)) || 0);
  /** There's something new to look at: the bell shows until it's clicked. */
  readonly hasNew = computed(() => this.fresh() > 0);
  /** Goes up each time the bell is clicked, so an open /admin page can reload its queue. */
  readonly reviewRequests = signal(0);

  private timer?: ReturnType<typeof setInterval>;
  private readonly onWake = () => {
    if (document.visibilityState === 'visible') void this.refresh();
  };

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
    if (this.enabled()) this.start();
  }

  /** Called after signing in to /admin: switches the bell on, unless it was turned off on this device. */
  async setUp(admin: AdminCaller): Promise<void> {
    if (read(OFF)) return;
    await this.switchOn(admin);
  }

  async switchOn(admin: AdminCaller): Promise<boolean> {
    const res = await admin.call<{ alertKey: string }>('/admin/alert-key');
    if (!res.ok) return false;
    write(KEY, res.data.alertKey);
    write(OFF, '');
    this.key.set(res.data.alertKey);
    this.start();
    return true;
  }

  /** Hides the bell on this device (it stays off until switched on again in /admin). */
  switchOff(): void {
    write(KEY, '');
    write(OFF, '1');
    this.key.set('');
    this.waiting.set(0);
    this.fresh.set(0);
    this.latest.set([]);
    this.stop();
  }

  /** The owner clicked the bell: everything that has arrived so far counts as seen. */
  markSeen(): void {
    const newest = Math.max(this.seenAt(), this.newest());
    this.seenAt.set(newest);
    write(SEEN, String(newest));
    this.fresh.set(0);
    this.reviewRequests.update((n) => n + 1);
  }

  async refresh(): Promise<void> {
    const key = this.key();
    if (!key || !this.apiUp()) return;
    const res = await api<{ waiting: number; fresh: number; newest: number; latest: WaitingPostcard[] }>(
      `/alerts?since=${this.seenAt()}`,
      { key },
    );
    if (res.ok) {
      this.waiting.set(res.data.waiting);
      this.fresh.set(res.data.fresh);
      this.newest.set(res.data.newest);
      this.latest.set(res.data.latest);
    } else if (res.status === 401) {
      // The admin key changed: this device's alert key no longer works.
      write(KEY, '');
      this.key.set('');
      this.stop();
    }
  }

  private start(): void {
    void this.refresh();
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (document.visibilityState === 'visible') void this.refresh();
    }, EVERY_MS);
    document.addEventListener('visibilitychange', this.onWake);
  }

  private stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
    document.removeEventListener('visibilitychange', this.onWake);
  }
}

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function write(key: string, value: string): void {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable: the bell just won't remember this device */
  }
}
