import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ExperienceItem } from '@data/portfolio.data';
import { Paintable } from '@shared/paint/paintable.directive';

/** One stop on the journey: a paintable marker + a card, alternating sides. */
@Component({
  selector: 'app-timeline-entry',
  imports: [Paintable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.right]': 'index() % 2 === 1' },
  template: `
    @let e = item();
    <svg class="node art" viewBox="0 0 44 44">
      <!-- id must match siteRegionIds() in core/chapters.ts -->
      <path
        d="M22 6c9 0 16 6 16 16s-7 16-16 16S6 31 6 22 13 6 22 6Z"
        [appPaintable]="'journey-' + index()"
        [trueColor]="index() % 6"
        [label]="e.org + ' marker'"
      />
    </svg>
    <article class="card body">
      <span class="period">{{ e.period }}</span>
      <h3>{{ e.role }}</h3>
      <p class="org">{{ e.org }}</p>
      <p>{{ e.summary }}</p>
      @if (e.highlights.length) {
        <ul>
          @for (h of e.highlights; track $index) {
            <li>{{ h }}</li>
          }
        </ul>
      }
    </article>
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 64px 1fr;
      align-items: center;
    }
    .node {
      --sw: 2.5;
      grid-column: 2;
      grid-row: 1;
      width: 44px;
      height: 44px;
      justify-self: center;
      z-index: 1;
    }
    .body {
      grid-column: 1;
      grid-row: 1;
      padding: 22px 24px;
    }
    :host(.right) .body {
      grid-column: 3;
    }
    .period {
      font-family: var(--font-hand);
      font-size: 1.35rem;
      color: var(--muted);
    }
    h3 {
      font-size: 1.4rem;
    }
    .org {
      margin: 2px 0 10px;
      font-weight: 600;
    }
    .body p:last-child,
    ul {
      margin-bottom: 0;
    }
    ul {
      padding-left: 1.1em;
    }
    @media (max-width: 760px) {
      :host {
        grid-template-columns: 44px 1fr;
        gap: 12px;
      }
      .node {
        grid-column: 1;
      }
      .body,
      :host(.right) .body {
        grid-column: 2;
      }
    }
  `,
})
export class TimelineEntry {
  readonly item = input.required<ExperienceItem>();
  readonly index = input.required<number>();
}
