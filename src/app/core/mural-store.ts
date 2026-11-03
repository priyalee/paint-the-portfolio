import { InjectionToken, inject } from '@angular/core';
import { ApiStatus, api } from '@core/api';
import { readEditToken, saveEditToken } from '@core/edit-tokens';
import { HEX_COLOR, MAX_NAME, MAX_PLACE } from '@core/wall-limits';

/** One visitor's contribution: the single mural region they painted. */
export interface MuralClaim {
  id: string;
  regionId: string;
  /** Hex colour, stored as-is so it never changes with palette moods. */
  color: string;
  name: string;
  place: string;
  createdAt: number;
}

export type ClaimResult = { ok: true } | { ok: false; reason: string };

/**
 * Storage for the community mural. When the site's backend is running
 * (/api, see server/walls.ts) every visitor shares one mural and the database
 * enforces "one region = one claim". Without it (plain `ng serve`) claims are
 * kept in this browser only, so the wall still works while developing.
 */
export interface MuralBackend {
  list(): Promise<MuralClaim[]>;
  claim(claim: MuralClaim): Promise<ClaimResult>;
  /** Changes colour / name / place of an existing claim (same id and region). */
  update(claim: MuralClaim): Promise<ClaimResult>;
}

export const MURAL_BACKEND = new InjectionToken<MuralBackend>('MURAL_BACKEND', {
  providedIn: 'root',
  factory: () => (inject(ApiStatus).available() ? new HttpMuralBackend() : new LocalMuralBackend()),
});

export { MAX_NAME, MAX_PLACE } from '@core/wall-limits';

export function isValidClaim(c: unknown): c is MuralClaim {
  if (!c || typeof c !== 'object') return false;
  const v = c as Partial<MuralClaim>;
  return (
    typeof v.id === 'string' &&
    typeof v.regionId === 'string' &&
    v.regionId.length <= 40 &&
    typeof v.color === 'string' &&
    HEX_COLOR.test(v.color) &&
    typeof v.name === 'string' &&
    v.name.length <= MAX_NAME &&
    typeof v.place === 'string' &&
    v.place.length <= MAX_PLACE &&
    typeof v.createdAt === 'number'
  );
}

class LocalMuralBackend implements MuralBackend {
  private readonly key = 'ink-pigment:mural';

  async list(): Promise<MuralClaim[]> {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(this.key) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter(isValidClaim) : [];
    } catch {
      return [];
    }
  }

  async claim(claim: MuralClaim): Promise<ClaimResult> {
    const all = await this.list();
    if (all.some((c) => c.regionId === claim.regionId)) {
      return { ok: false, reason: 'Someone just painted that shape — pick another one.' };
    }
    try {
      localStorage.setItem(this.key, JSON.stringify([...all, claim]));
      return { ok: true };
    } catch {
      return { ok: false, reason: 'Could not save right now — please try again.' };
    }
  }

  async update(claim: MuralClaim): Promise<ClaimResult> {
    if (!isValidClaim(claim)) return { ok: false, reason: 'Those changes could not be saved.' };
    const all = await this.list();
    const i = all.findIndex((c) => c.id === claim.id && c.regionId === claim.regionId);
    if (i < 0) return { ok: false, reason: 'Your shape could not be found on the mural.' };
    try {
      all[i] = claim;
      localStorage.setItem(this.key, JSON.stringify(all));
      return { ok: true };
    } catch {
      return { ok: false, reason: 'Could not save right now — please try again.' };
    }
  }
}

/** The shared mural, stored by the site's backend (/api/mural). */
class HttpMuralBackend implements MuralBackend {
  async list(): Promise<MuralClaim[]> {
    const res = await api<MuralClaim[]>('/mural');
    return res.ok ? res.data.filter(isValidClaim) : [];
  }

  async claim(claim: MuralClaim): Promise<ClaimResult> {
    const res = await api<{ editToken: string }>('/mural', { method: 'POST', body: claim });
    if (!res.ok) return { ok: false, reason: res.reason };
    saveEditToken(claim.id, res.data.editToken);
    return { ok: true };
  }

  async update(claim: MuralClaim): Promise<ClaimResult> {
    const editToken = readEditToken(claim.id);
    if (!editToken) return { ok: false, reason: 'This shape can only be changed from the browser that painted it.' };
    const { color, name, place } = claim;
    const res = await api(`/mural/${claim.id}`, { method: 'PATCH', body: { editToken, color, name, place } });
    return res.ok ? { ok: true } : { ok: false, reason: res.reason };
  }
}
