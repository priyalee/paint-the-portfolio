import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiStatus, api } from '@core/api';
import {
  ExperienceItem,
  PORTFOLIO,
  Portfolio,
  Project,
  SkillGroup,
  SocialLink,
} from '@data/portfolio.data';

const DRAFT_KEY = 'ink-pigment:content-draft';

/**
 * Runtime source of all personal content.
 *
 *  1. `PORTFOLIO` (portfolio.data.ts) — built-in fallback.
 *  2. Published content           — fetched at start-up: from the backend (/api/content,
 *                                     set with publish() from /admin) when it has some,
 *                                     otherwise from `public/content.json`.
 *  3. Local draft                    — edits made in the hidden editor, visible
 *                                     only in the editor's own browser until exported.
 */
@Injectable({ providedIn: 'root' })
export class ContentStore {
  private readonly apiStatus = inject(ApiStatus);
  private readonly published = signal<Portfolio>(PORTFOLIO);
  private readonly draft = signal<Portfolio | null>(readDraft());

  readonly content = computed(() => this.draft() ?? this.published());
  readonly hasDraft = computed(() => this.draft() !== null);
  readonly editorOpen = signal(false);

  async load(): Promise<void> {
    if (this.apiStatus.available()) {
      const live = await api<unknown>('/content');
      if (live.ok) {
        this.published.set(normalizePortfolio(live.data, PORTFOLIO));
        return;
      }
    }
    try {
      const res = await fetch('content.json', { cache: 'no-cache' });
      if (res.ok) this.published.set(normalizePortfolio(await res.json(), PORTFOLIO));
    } catch {
      /* offline or missing file — keep the built-in fallback */
    }
  }

  /** Live-preview + autosave edits as a local draft. */
  preview(next: Portfolio): void {
    const clean = normalizePortfolio(next, this.published());
    this.draft.set(clean);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(clean));
    } catch {
      /* storage unavailable */
    }
  }

  discardDraft(): void {
    this.draft.set(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  /** Accepts JSON text (a file or a filled-in template). Missing fields keep current values. */
  importJson(text: string): { ok: true } | { ok: false; error: string } {
    const json = extractJson(text);
    if (!json) return { ok: false, error: 'No JSON object found in the pasted text.' };
    try {
      this.preview(normalizePortfolio(JSON.parse(json), this.content()));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
    }
  }

  /** Publishes the current content (draft included) for every visitor. Needs the admin key. */
  async publish(adminKey: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const content = this.content();
    const res = await api('/admin/content', { method: 'PUT', body: content, key: adminKey });
    if (!res.ok) return { ok: false, error: res.reason };
    this.published.set(content);
    this.discardDraft();
    return { ok: true };
  }

  exportJson(): string {
    return JSON.stringify(this.content(), null, 2) + '\n';
  }
}

// ------------------------------------------------------------ normalising

function readDraft(): Portfolio | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? normalizePortfolio(JSON.parse(raw), PORTFOLIO) : null;
  } catch {
    return null;
  }
}

/** Pulls the first {...} block out of text, so notes or ``` fences around the JSON are ignored. */
function extractJson(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 && end > start ? text.slice(start, end + 1) : null;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

function str(v: unknown, fallback: string, max = 600): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : fallback;
}

function int(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n))) : fallback;
}

/** Only http(s), mailto and site-relative links survive — no javascript: etc. */
export function safeUrl(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return '';
  if (/^(https?:\/\/|mailto:|\/(?!\/))/i.test(s)) return s.slice(0, 500);
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) return 'https://' + s.slice(0, 490);
  return '';
}

function list<T>(v: unknown, fallback: T[], map: (item: unknown, i: number) => T | null, max = 24): T[] {
  if (!Array.isArray(v)) return fallback;
  return v
    .slice(0, max)
    .map(map)
    .filter((x): x is T => x !== null);
}

function strings(v: unknown, max = 24, len = 600): string[] | null {
  if (!Array.isArray(v)) return null;
  return v
    .filter((s): s is string => typeof s === 'string' && !!s.trim())
    .slice(0, max)
    .map((s) => s.trim().slice(0, len));
}

export function normalizePortfolio(input: unknown, base: Portfolio): Portfolio {
  const o = isObj(input) ? input : {};
  const name = str(o['name'], base.name, 60);
  const initials = str(o['initials'], '', 3) || initialsOf(name) || base.initials;

  return {
    name,
    initials,
    role: str(o['role'], base.role, 120),
    tagline: str(o['tagline'], base.tagline, 240),
    location: str(o['location'], base.location, 80),
    email: str(o['email'], base.email, 120),
    resumeUrl: o['resumeUrl'] === undefined ? base.resumeUrl : safeUrl(o['resumeUrl']),
    about: strings(o['about'], 6, 1200) ?? base.about,
    facts: list(o['facts'], base.facts, (f) =>
      isObj(f) ? { label: str(f['label'], '', 40), value: str(f['value'], '', 80) } : null,
    ),
    skills: list(o['skills'], base.skills, (g): SkillGroup | null =>
      isObj(g)
        ? {
            name: str(g['name'], 'Skills', 40),
            items: list(g['items'], [], (s) =>
              isObj(s)
                ? { name: str(s['name'], '', 40), level: int(s['level'], 50, 0, 100) }
                : null,
            ),
          }
        : null,
    ),
    projects: list(o['projects'], base.projects, (p, i): Project | null =>
      isObj(p)
        ? {
            title: str(p['title'], 'Untitled project', 80),
            year: str(p['year'], '', 20),
            tagline: str(p['tagline'], '', 140),
            description: str(p['description'], '', 900),
            tech: strings(p['tech'], 12, 30) ?? [],
            links: list(p['links'], [], (l) => {
              if (!isObj(l)) return null;
              const url = safeUrl(l['url']);
              return url ? { label: str(l['label'], 'Link', 30), url } : null;
            }, 4),
            slot: int(p['slot'], i % 6, 0, 5),
          }
        : null,
    ),
    experience: list(o['experience'], base.experience, (e): ExperienceItem | null =>
      isObj(e)
        ? {
            role: str(e['role'], '', 80),
            org: str(e['org'], '', 80),
            period: str(e['period'], '', 40),
            summary: str(e['summary'], '', 400),
            highlights: strings(e['highlights'], 8, 200) ?? [],
          }
        : null,
    ),
    socials: list(o['socials'], base.socials, (s): SocialLink | null => {
      if (!isObj(s)) return null;
      const url = safeUrl(s['url']);
      return url
        ? { label: str(s['label'], 'Link', 30), url, handle: str(s['handle'], '', 60) }
        : null;
    }, 8),
  };
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
