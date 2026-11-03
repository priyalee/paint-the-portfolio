import { ActivatedRouteSnapshot, ViewTransitionInfo } from '@angular/router';
import { CHAPTERS } from '@core/chapters';
import { reducedMotion } from '@core/paint-state';

/**
 * How a route change turns the sketchbook:
 * - `forward` — the current page lifts off the spine and turns right-to-left;
 * - `back`    — the previous page swings back in from the spine, left-to-right;
 * - `fade`    — a quick crossfade (reduced motion, same page, first load, back office).
 */
export type PageTurn = 'forward' | 'back' | 'fade';

/** Reading position of a top-level route: home is -1, chapters 0…n, anything else null. */
export function chapterIndex(root: ActivatedRouteSnapshot): number | null {
  const top = root.firstChild?.routeConfig;
  if (!top) return null;
  if (top.path === '') return -1;
  const i = CHAPTERS.findIndex((c) => c.path === top.path);
  return i < 0 ? null : i;
}

export function pageTurnFor(from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot): PageTurn {
  if (reducedMotion()) return 'fade';
  const a = chapterIndex(from);
  const b = chapterIndex(to);
  if (a === null || b === null || a === b) return 'fade';
  return b > a ? 'forward' : 'back';
}

let current: ViewTransition | null = null;

/**
 * Router `onViewTransitionCreated` hook. Runs synchronously after
 * startViewTransition(), i.e. before the old page is captured, so the
 * `page-transition` class can still give fixed chrome its own
 * view-transition-name (see styles/_page-turn.scss) and keep it out of the flip.
 * Theme / mode sweeps call startViewTransition() themselves and never get here.
 */
export function startPageTurn({ transition, from, to }: ViewTransitionInfo): void {
  const root = document.documentElement;
  current = transition;
  root.classList.add('page-transition');
  root.dataset['pageTurn'] = pageTurnFor(from, to);
  transition.finished.finally(() => {
    // A newer navigation may already own the classes; leave them to it.
    if (current !== transition) return;
    current = null;
    root.classList.remove('page-transition');
    delete root.dataset['pageTurn'];
  });
}
