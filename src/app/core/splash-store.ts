import { InjectionToken, inject } from '@angular/core';
import { ApiStatus, api } from '@core/api';
import { readEditToken, saveEditToken } from '@core/edit-tokens';
import { HEX_COLOR, MAX_NAME, MAX_PLACE, SPLASH_SIZE, SPLASH_WALL } from '@core/wall-limits';

export { SPLASH_SIZE, SPLASH_WALL } from '@core/wall-limits';

/** One visitor's paint splash on the wall. */
export interface Splash {
  id: string;
  x: number;
  y: number;
  /** Seed for the splat shape (see shared/art/splat.ts). */
  seed: number;
  size: number;
  /** Hex colour, stored as-is so it never changes with palette moods. */
  color: string;
  name: string;
  place: string;
  createdAt: number;
}

export type SplashResult = { ok: true } | { ok: false; reason: string };

/**
 * Storage for the splash wall. Shared through the site's backend (/api,
 * see server/walls.ts) when it is running; otherwise kept in this browser
 * only, the same way as MURAL_BACKEND.
 */
export interface SplashBackend {
  list(): Promise<Splash[]>;
  add(splash: Splash): Promise<SplashResult>;
  /** Changes colour / name / place of an existing splash (same id). */
  update(splash: Splash): Promise<SplashResult>;
}

export const SPLASH_BACKEND = new InjectionToken<SplashBackend>('SPLASH_BACKEND', {
  providedIn: 'root',
  factory: () => (inject(ApiStatus).available() ? new HttpSplashBackend() : new LocalSplashBackend()),
});

export function isValidSplash(s: unknown): s is Splash {
  if (!s || typeof s !== 'object') return false;
  const v = s as Partial<Splash>;
  return (
    typeof v.id === 'string' &&
    typeof v.x === 'number' &&
    v.x >= 0 &&
    v.x <= SPLASH_WALL.width &&
    typeof v.y === 'number' &&
    v.y >= 0 &&
    v.y <= SPLASH_WALL.height &&
    Number.isInteger(v.seed) &&
    typeof v.size === 'number' &&
    v.size >= SPLASH_SIZE.min &&
    v.size <= SPLASH_SIZE.max &&
    typeof v.color === 'string' &&
    HEX_COLOR.test(v.color) &&
    typeof v.name === 'string' &&
    v.name.length <= MAX_NAME &&
    typeof v.place === 'string' &&
    v.place.length <= MAX_PLACE &&
    typeof v.createdAt === 'number'
  );
}

class LocalSplashBackend implements SplashBackend {
  private readonly key = 'ink-pigment:splashes';

  async list(): Promise<Splash[]> {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(this.key) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter(isValidSplash) : [];
    } catch {
      return [];
    }
  }

  async add(splash: Splash): Promise<SplashResult> {
    if (!isValidSplash(splash)) return { ok: false, reason: 'That splash missed the wall — try again.' };
    try {
      const all = await this.list();
      localStorage.setItem(this.key, JSON.stringify([...all, splash]));
      return { ok: true };
    } catch {
      return { ok: false, reason: 'Could not save right now — please try again.' };
    }
  }

  async update(splash: Splash): Promise<SplashResult> {
    if (!isValidSplash(splash)) return { ok: false, reason: 'Those changes could not be saved.' };
    const all = await this.list();
    const i = all.findIndex((s) => s.id === splash.id);
    if (i < 0) return { ok: false, reason: 'Your splash could not be found on the wall.' };
    try {
      all[i] = splash;
      localStorage.setItem(this.key, JSON.stringify(all));
      return { ok: true };
    } catch {
      return { ok: false, reason: 'Could not save right now — please try again.' };
    }
  }
}

/** The shared splash wall, stored by the site's backend (/api/splashes). */
class HttpSplashBackend implements SplashBackend {
  async list(): Promise<Splash[]> {
    const res = await api<Splash[]>('/splashes');
    return res.ok ? res.data.filter(isValidSplash) : [];
  }

  async add(splash: Splash): Promise<SplashResult> {
    const res = await api<{ editToken: string }>('/splashes', { method: 'POST', body: splash });
    if (!res.ok) return { ok: false, reason: res.reason };
    saveEditToken(splash.id, res.data.editToken);
    return { ok: true };
  }

  async update(splash: Splash): Promise<SplashResult> {
    const editToken = readEditToken(splash.id);
    if (!editToken) return { ok: false, reason: 'This splash can only be changed from the browser that threw it.' };
    const { color, name, place } = splash;
    const res = await api(`/splashes/${splash.id}`, { method: 'PATCH', body: { editToken, color, name, place } });
    return res.ok ? { ok: true } : { ok: false, reason: res.reason };
  }
}
