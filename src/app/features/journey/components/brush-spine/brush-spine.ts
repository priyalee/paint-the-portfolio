import { ChangeDetectionStrategy, Component, input } from '@angular/core';

const SPINE = 'M50 0C72 70 28 150 50 250S72 420 50 500S28 670 50 750S72 920 50 1000';

/** The wavy brush stroke behind the timeline; `progress` (0-1) controls how much is inked. */
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
      stroke: var(--accent);
      stroke-width: 9;
      stroke-dasharray: 1 1;
      filter: url(#brush-edge);
      transition: stroke 0.5s;
    }
    @media (max-width: 760px) {
      :host {
        left: 22px;
      }
    }
  `,
})
export class BrushSpine {
  readonly progress = input(0);
  protected readonly d = SPINE;
}
