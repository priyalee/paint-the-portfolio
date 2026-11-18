import { Injectable, signal } from '@angular/core';

export const API = '/api';

/** Waits before each background re-check when the first one timed out or the network failed. */
const RETRY_DELAYS_MS = [3_000, 10_000, 30_000];

/**
 * Knows whether the site's backend (/api) is reachable. Checked at start-up:
 * on the live site it is; with plain `ng serve` and no API running it isn't,
 * and the walls fall back to saving in the browser.
 *
 * The start-up check is kept short so a slow network doesn't hold up the
 * first page. If it times out or the network fails, it keeps trying quietly in
 * the background; the Send button and the walls (which pick their storage when
 * first opened) follow `available` once it turns true.
 */
@Injectable({ providedIn: 'root' })
export class ApiStatus {
  readonly available = signal(false);

  async check(): Promise<void> {
    const result = await this.ping(3_500);
    this.available.set(result === 'up');
    if (result === 'unreachable') void this.retryLater();
  }

  private async retryLater(): Promise<void> {
    for (const delay of RETRY_DELAYS_MS) {
      await new Promise((r) => setTimeout(r, delay));
      const result = await this.ping(8_000);
      if (result === 'up') {
        this.available.set(true);
        return;
      }
      if (result === 'absent') return;
    }
  }

  /** 'up', 'absent' (answered, but there's no backend) or 'unreachable' (timed out / offline). */
  private async ping(timeoutMs: number): Promise<'up' | 'absent' | 'unreachable'> {
    // AbortController + setTimeout rather than AbortSignal.timeout(), which older Safari lacks.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API}/health`, { signal: controller.signal, cache: 'no-store' });
      const body = res.ok ? await res.json().catch(() => null) : null;
      return body?.ok ? 'up' : 'absent';
    } catch {
      return 'unreachable';
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Set by the Connection service: told when a request fails at the network level. */
let networkErrorListener: (() => void) | null = null;
export function onNetworkError(listener: (() => void) | null): void {
  networkErrorListener = listener;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; reason: string };

/** fetch() for /api with JSON in and out, and friendly error messages. */
export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; key?: string } = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(init.key ? { authorization: `Bearer ${init.key}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, status: res.status, reason: data?.error ?? 'Could not reach the site — please try again.' };
    }
    return { ok: true, data: data as T };
  } catch {
    networkErrorListener?.();
    return { ok: false, status: 0, reason: 'You seem to be offline — please try again.' };
  }
}
