import { Injectable, signal } from '@angular/core';

export const API = '/api';

/**
 * Knows whether the site's backend (/api) is reachable. Checked once at
 * start-up: on the live site it is; with plain `ng serve` and no API running
 * it isn't, and the walls fall back to saving in the browser.
 */
@Injectable({ providedIn: 'root' })
export class ApiStatus {
  readonly available = signal(false);

  async check(): Promise<void> {
    try {
      const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(2500) });
      const body = res.ok ? await res.json() : null;
      this.available.set(!!body?.ok);
    } catch {
      this.available.set(false);
    }
  }
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
    return { ok: false, status: 0, reason: 'You seem to be offline — please try again.' };
  }
}
