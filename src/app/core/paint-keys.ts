import type { Portfolio } from '@data/portfolio.data';

/**
 * Stable keys for list content (skill groups, skills, projects, journey
 * entries), so a visitor's paint follows the item itself: reordering items
 * in the editor no longer moves paint onto a different item.
 *
 * An item keeps the `key` saved with the content; items without one get a
 * key from their name. Keys always start with a letter, so they can never
 * clash with the old position-based ids (all digits), and contain no dots,
 * so "skill-<group>." prefixes stay unambiguous.
 */
export const KEY_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;

export interface Keyed {
  key?: string;
}

export function slugKey(text: string): string {
  const s = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  if (!s) return '';
  return /^[a-z]/.test(s) ? s : `n${s}`;
}

/** One unique key per item: its saved key, else one made from its label. */
export function listKeys<T extends Keyed>(items: readonly T[], label: (item: T) => string, fallback: string): string[] {
  const used = new Set<string>();
  return items.map((item, i) => {
    const base =
      item.key && KEY_PATTERN.test(item.key) ? item.key : slugKey(label(item)) || `${fallback}-${i + 1}`;
    let key = base;
    for (let n = 2; used.has(key); n++) key = `${base}-${n}`;
    used.add(key);
    return key;
  });
}

/** The same list with every item's key filled in (used when content is cleaned). */
export function withKeys<T extends Keyed>(items: T[], label: (item: T) => string, fallback: string): T[] {
  const keys = listKeys(items, label, fallback);
  return items.map((item, i) => ({ ...item, key: keys[i] }));
}

export interface SiteKeys {
  skills: { key: string; items: string[] }[];
  projects: string[];
  journey: string[];
}

export function siteKeys(c: Portfolio): SiteKeys {
  const groups = listKeys(c.skills, (g) => g.name, 'group');
  return {
    skills: c.skills.map((g, gi) => ({ key: groups[gi], items: listKeys(g.items, (s) => s.name, 'skill') })),
    projects: listKeys(c.projects, (p) => p.title, 'project'),
    journey: listKeys(c.experience, (e) => `${e.role} ${e.org}`, 'entry'),
  };
}

// Paint-region ids built from the keys. Prefixes chapters.ts relies on:
// "skill-", "work-", "journey-".
export const skillShelfPrefix = (groupKey: string) => `skill-${groupKey}.`;
export const skillJarId = (groupKey: string, skillKey: string) => `skill-${groupKey}.${skillKey}`;
export const projectRegionId = (key: string) => `work-${key}`;
export const journeyRegionId = (key: string) => `journey-${key}`;

/**
 * Old position-based region ids → the new key-based ones, built from the
 * content as it is now (its order is the order the paint was made in).
 * Used once per browser to carry existing paint over.
 */
export function legacyRegionMap(c: Portfolio): Record<string, string> {
  const k = siteKeys(c);
  const map: Record<string, string> = {};
  k.skills.forEach((g, gi) =>
    g.items.forEach((s, i) => {
      for (const part of ['paint', 'lid']) map[`skill-${gi}-${i}-${part}`] = `${skillJarId(g.key, s)}-${part}`;
    }),
  );
  k.projects.forEach((p, i) => (map[`work-${i}`] = projectRegionId(p)));
  k.journey.forEach((e, i) => (map[`journey-${i}`] = journeyRegionId(e)));
  return map;
}
