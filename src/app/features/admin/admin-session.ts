import { Injectable, signal } from '@angular/core';
import { ApiResult, api } from '@core/api';

const KEY = 'ink-pigment:admin-key';

/**
 * The owner's admin login for this tab. The key lives in sessionStorage only,
 * so it is forgotten when the tab closes.
 */
@Injectable({ providedIn: 'root' })
export class AdminSession {
  readonly key = signal(read());
  readonly signedIn = signal(false);

  async login(key: string): Promise<ApiResult<unknown>> {
    const res = await api('/admin/check', { key });
    if (res.ok) {
      this.key.set(key);
      this.signedIn.set(true);
      write(key);
    }
    return res;
  }

  /** Re-checks a key remembered from earlier in this tab. */
  async resume(): Promise<void> {
    const key = this.key();
    if (key && !this.signedIn()) {
      const res = await this.login(key);
      if (!res.ok) this.logout();
    }
  }

  logout(): void {
    this.key.set('');
    this.signedIn.set(false);
    write('');
  }

  call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
    return api<T>(path, { ...init, key: this.key() });
  }

  /** Loads a private image (e.g. a pending postcard) and returns an object URL for <img>. */
  async image(path: string): Promise<string | null> {
    try {
      const res = await fetch(path, { headers: { authorization: `Bearer ${this.key()}` } });
      return res.ok ? URL.createObjectURL(await res.blob()) : null;
    } catch {
      return null;
    }
  }
}

function read(): string {
  try {
    return sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

function write(key: string): void {
  try {
    if (key) sessionStorage.setItem(KEY, key);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
