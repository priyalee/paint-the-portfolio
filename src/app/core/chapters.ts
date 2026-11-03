import { ENVELOPE, PORTRAIT, STUDIO_ART } from '@shared/art/art';
import { Portfolio } from '@data/portfolio.data';
import { PaintScope } from '@core/paint-state';

/** Every independent page of the site, in reading order. */
export interface Chapter {
  path: string;
  label: string;
  no: string;
  blurb: string;
  /** Paint-region prefix for this page's progress (null = nothing to paint). */
  prefix: string | null;
  scope: PaintScope;
}

export const CHAPTERS: Chapter[] = [
  { path: 'about', label: 'About', no: '01', blurb: 'Who I am — in a paintable portrait.', prefix: 'about-', scope: 'site' },
  { path: 'skills', label: 'Skills', no: '02', blurb: 'A shelf of paint jars, filled to my level.', prefix: 'skill-', scope: 'site' },
  { path: 'work', label: 'Work', no: '03', blurb: 'Projects as paint-store colour chips.', prefix: 'work-', scope: 'site' },
  { path: 'journey', label: 'Journey', no: '04', blurb: 'My path, drawn as one long brush stroke.', prefix: 'journey-', scope: 'site' },
  { path: 'wall', label: 'Wall', no: '05', blurb: 'Paint a piece of the mural or splash the wall.', prefix: null, scope: 'site' },
  { path: 'contact', label: 'Contact', no: '06', blurb: 'Say hi — and make a postcard of your painting.', prefix: 'contact-', scope: 'site' },
  { path: 'studio', label: 'Studio', no: '07', blurb: 'Free colouring pages, just for fun.', prefix: '', scope: 'studio' },
];

/**
 * Every paintable region id on the site, derived from content + line art.
 * Lets progress be accurate across pages the visitor hasn't opened yet.
 * Must mirror the ids used in the section templates.
 */
export function siteRegionIds(content: Portfolio): string[] {
  const art = (prefix: string, shapes: { id: string; slot: unknown }[]) =>
    shapes.filter((s) => s.slot !== 'line').map((s) => prefix + s.id);
  return [
    ...art('about-', PORTRAIT.shapes),
    ...content.skills.flatMap((g, gi) =>
      g.items.flatMap((_, i) => [`skill-${gi}-${i}-paint`, `skill-${gi}-${i}-lid`]),
    ),
    ...content.projects.map((_, i) => `work-${i}`),
    ...content.experience.map((_, i) => `journey-${i}`),
    ...art('contact-', ENVELOPE.shapes),
  ];
}

/** Every paintable region id across all Studio colouring pages. */
export function studioRegionIds(): string[] {
  return STUDIO_ART.flatMap((a) =>
    a.shapes.filter((s) => s.slot !== 'line').map((s) => `${a.id}:${s.id}`),
  );
}
