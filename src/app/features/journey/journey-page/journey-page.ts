import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ContentStore } from '@core/content-store';
import { reducedMotion } from '@core/paint-state';
import { Reveal } from '@shared/directives/reveal.directive';
import { PaintBlock } from '@shared/paint/paint-block.directive';
import { SectionHeader } from '@shared/ui/section-header';
import { BrushSpine } from '../components/brush-spine/brush-spine';
import { TimelineEntry } from '../components/timeline-entry/timeline-entry';

/** Experience timeline whose spine is a brush stroke drawn as you scroll. */
@Component({
  selector: 'app-journey-page',
  imports: [BrushSpine, TimelineEntry, SectionHeader, Reveal, PaintBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'measure()',
    '(window:resize)': 'measure()',
  },
  template: `
    <section class="section" id="journey">
      <div class="container">
        <app-section-header
          eyebrow="04 — Journey"
          before="One long"
          accent="brush stroke"
          note="Scroll and the ink keeps flowing. Dots are paintable."
        />
        <div class="timeline" #timeline appPaintBlock="journey-" blockTitle="Journey markers">
          <app-brush-spine [progress]="progress()" />
          @for (item of data().experience; track $index; let i = $index) {
            <app-timeline-entry [item]="item" [index]="i" appReveal />
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .timeline {
      position: relative;
      display: grid;
      gap: clamp(28px, 5vw, 56px);
      padding: 20px 0;
    }
  `,
})
export class JourneyPage {
  protected readonly data = inject(ContentStore).content;
  protected readonly progress = signal(0);
  private readonly timeline = viewChild.required<ElementRef<HTMLElement>>('timeline');

  constructor() {
    afterNextRender(() => this.measure());
  }

  protected measure(): void {
    if (reducedMotion()) {
      this.progress.set(1);
      return;
    }
    const rect = this.timeline().nativeElement.getBoundingClientRect();
    const p = (window.innerHeight * 0.7 - rect.top) / rect.height;
    this.progress.set(Math.max(0, Math.min(1, p)));
  }
}
