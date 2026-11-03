import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The stitched binding down the left edge of the screen: pages turn around
 * it on route changes, and it stays put while they do (see _page-turn.scss).
 */
@Component({
  selector: 'app-sketch-spine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg class="stitches" width="100%" height="100%" focusable="false">
      <defs>
        <pattern id="spine-stitch" width="12" height="26" patternUnits="userSpaceOnUse">
          <circle cx="6.2" cy="4" r="1.3" />
          <path d="M6.2 4.6 C6.9 9 5.6 13 6.4 17.4" />
          <circle cx="6.4" cy="18" r="1.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#spine-stitch)" />
    </svg>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 40;
      width: 18px;
      pointer-events: none;
      color: var(--muted);
      /* the fold where the page dips into the binding */
      background: linear-gradient(
        to right,
        color-mix(in srgb, var(--ink) 9%, transparent),
        color-mix(in srgb, var(--ink) 3%, transparent) 60%,
        transparent
      );
      border-right: 1.5px solid var(--line);
    }
    .stitches {
      display: block;
      fill: currentColor;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
    }
    .stitches path {
      fill: none;
    }
    @media (max-width: 720px) {
      :host {
        width: 10px;
      }
      .stitches {
        transform: translateX(-3px);
      }
    }
    @media print {
      :host {
        display: none;
      }
    }
  `,
})
export class SketchSpine {}
