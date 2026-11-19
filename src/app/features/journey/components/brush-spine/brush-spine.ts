import { ChangeDetectionStrategy, Component, input } from '@angular/core';

const SPINE = 'M50 0C72 70 28 150 50 250S72 420 50 500S28 670 50 750S72 920 50 1000';

/**
 * True when the browser can tie the stroke to the scroll position in CSS
 * (scroll-driven animations). Then the browser draws it in the same frame
 * as the scroll, and `progress` is not needed.
 */
export const SCROLL_DRIVEN = globalThis.CSS?.supports?.('animation-timeline: view()') ?? false;

/**
 * The wavy brush stroke behind the timeline. It is inked while the timeline
 * passes a line 70% down the screen: by a scroll-driven animation where
 * supported, otherwise by `progress` (0-1).
 */
@Component({
  selector: 'app-brush-spine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 100 1000" preserveAspectRatio="none">
      <path class="ghost" [attr.d]="d" vector-effect="non-scaling-stroke" />
      <path
        class="ink"
        [attr.d]="d"
        pathLength="1"
        vector-effect="non-scaling-stroke"
        [style.stroke-dashoffset]="1 - progress()"
      />
    </svg>
  `,
  styles: `
    :host {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 60px;
      transform: translateX(-50%);
    }
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      fill: none;
    }
    path {
      stroke-linecap: round;
    }
    .ghost {
      stroke: var(--line);
      stroke-width: 3;
      stroke-dasharray: 2 10;
    }
    .ink {
      /* Pulled a little toward the ink colour so it reads strongly on paper and chalk alike. */
      stroke: color-mix(in srgb, var(--accent) 75%, var(--ink));
      stroke-width: 13;
      stroke-dasharray: 1 1;
      filter: url(#brush-edge);
      transition: stroke 0.5s;
    }
    @media (max-width: 760px) {
      :host {
        left: 22px;
      }
    }
    /*
     * On phones the stroke runs the full height of a very tall timeline. A filter
     * over an element that size is more than many phone GPUs will draw (the line
     * vanishes), and it is recomputed on every scroll step (the line lags).
     */
    @media (max-width: 760px), (pointer: coarse) {
      .ink {
        filter: none;
      }
    }
    /*
     * Scroll-driven: the stroke follows the scroll in the same frame, with no
     * script in between (a script always trails the finger on phones, where
     * scrolling runs on its own thread). 0% when the timeline's top reaches 70%
     * down the screen, 100% when its bottom does, the same as the script.
     * Inset 0: by default the page's scroll-padding (room for the navbar)
     * would shrink the measured screen and run the stroke ahead of the scroll.
     */
    @supports (animation-timeline: view()) {
      :host {
        view-timeline: --spine block;
        view-timeline-inset: 0;
      }
      .ink {
        animation: ink-flow linear both;
        animation-timeline: --spine;
        animation-range: cover 30vh cover calc(100% - 70vh);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .ink {
        animation: none;
      }
    }
    @keyframes ink-flow {
      from {
        stroke-dashoffset: 1;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
  `,
})
export class BrushSpine {
  readonly progress = input(0);
  protected readonly d = SPINE;
}
